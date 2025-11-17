import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:permission_handler/permission_handler.dart';

/// Service for managing local notifications and medication reminders
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  /// Initialize notification service
  Future<void> initialize() async {
    if (_initialized) return;

    // Request permissions
    await _requestPermissions();

    // Android settings
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS settings
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
      requestCriticalPermission: true,
      defaultPresentAlert: true,
      defaultPresentBadge: true,
      defaultPresentSound: true,
    );

    const initializationSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _handleNotificationTap,
      onDidReceiveBackgroundNotificationResponse: _handleBackgroundNotificationTap,
    );

    // Create notification channels (Android)
    if (Platform.isAndroid) {
      await _createNotificationChannels();
    }

    _initialized = true;
  }

  /// Request notification permissions
  Future<bool> _requestPermissions() async {
    if (Platform.isIOS) {
      final status = await Permission.notification.request();
      return status.isGranted;
    } else if (Platform.isAndroid) {
      if (await Permission.scheduleExactAlarm.isDenied) {
        await Permission.scheduleExactAlarm.request();
      }
      if (await Permission.notification.isDenied) {
        await Permission.notification.request();
      }
      return true;
    }
    return true;
  }

  /// Create notification channels for Android
  Future<void> _createNotificationChannels() async {
    // Medication reminder channel
    const medicationChannel = AndroidNotificationChannel(
      'medication_reminders',
      'Medication Reminders',
      description: 'Alerts for medication schedule',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    );

    // Workout reminder channel
    const workoutChannel = AndroidNotificationChannel(
      'workout_reminders',
      'Workout Reminders',
      description: 'Daily workout reminders',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
    );

    // Achievement channel
    const achievementChannel = AndroidNotificationChannel(
      'achievements',
      'Achievements',
      description: 'Achievement unlocked notifications',
      importance: Importance.high,
      playSound: true,
      showBadge: true,
    );

    // Social channel
    const socialChannel = AndroidNotificationChannel(
      'social',
      'Social',
      description: 'Friend activity and comments',
      importance: Importance.defaultImportance,
      playSound: true,
    );

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(medicationChannel);

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(workoutChannel);

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(achievementChannel);

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(socialChannel);
  }

  /// Schedule a medication reminder
  Future<void> scheduleMedicationReminder({
    required String medId,
    required String scheduleId,
    required String medicationName,
    required String dosage,
    required DateTime scheduledTime,
    String? mealTiming,
    bool waterReminder = false,
    String notificationSound = 'default',
    int snoozeDuration = 10,
  }) async {
    final notificationId = '${medId}_$scheduleId'.hashCode;

    final tzScheduledTime = tz.TZDateTime.from(scheduledTime, tz.local);

    final androidDetails = AndroidNotificationDetails(
      'medication_reminders',
      'Medication Reminders',
      channelDescription: 'Alerts for medication schedule',
      importance: Importance.max,
      priority: Priority.high,
      sound: RawResourceAndroidNotificationSound(notificationSound),
      enableVibration: true,
      fullScreenIntent: true,
      category: AndroidNotificationCategory.alarm,
      actions: [
        const AndroidNotificationAction(
          'take',
          'Take Now',
          showsUserInterface: true,
          contextual: true,
        ),
        AndroidNotificationAction(
          'snooze',
          'Snooze ${snoozeDuration}min',
          contextual: true,
        ),
        const AndroidNotificationAction(
          'skip',
          'Skip',
          cancelNotification: true,
        ),
      ],
    );

    const iosDetails = DarwinNotificationDetails(
      presentSound: true,
      presentAlert: true,
      presentBadge: true,
      categoryIdentifier: 'MEDICATION_REMINDER',
      interruptionLevel: InterruptionLevel.timeSensitive,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    String body = dosage;
    if (mealTiming != null && mealTiming != 'anytime') {
      body += ' - ${_formatMealTiming(mealTiming)}';
    }
    if (waterReminder) {
      body += ' - Drink water';
    }

    await _notifications.zonedSchedule(
      notificationId,
      '💊 Time for $medicationName',
      body,
      tzScheduledTime,
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time,
      payload: jsonEncode({
        'type': 'medication',
        'med_id': medId,
        'schedule_id': scheduleId,
        'snooze_duration': snoozeDuration,
      }),
    );
  }

  /// Cancel a medication reminder
  Future<void> cancelMedicationReminder(String medId, String scheduleId) async {
    final notificationId = '${medId}_$scheduleId'.hashCode;
    await _notifications.cancel(notificationId);
  }

  /// Cancel all medication reminders for a user
  Future<void> cancelAllMedicationReminders() async {
    await _notifications.cancelAll();
  }

  /// Schedule a refill reminder
  Future<void> scheduleRefillReminder({
    required String medId,
    required String medicationName,
    required DateTime refillDate,
    required int reminderDays,
  }) async {
    final reminderDate = refillDate.subtract(Duration(days: reminderDays));
    final notificationId = 'refill_$medId'.hashCode;

    final tzReminderDate = tz.TZDateTime(
      tz.local,
      reminderDate.year,
      reminderDate.month,
      reminderDate.day,
      9, // 9 AM
    );

    const androidDetails = AndroidNotificationDetails(
      'medication_reminders',
      'Medication Reminders',
      channelDescription: 'Alerts for medication schedule',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails(
      presentSound: true,
      presentAlert: true,
      presentBadge: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.zonedSchedule(
      notificationId,
      '🔔 Refill Reminder',
      '$medicationName needs refilling in $reminderDays days',
      tzReminderDate,
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      payload: jsonEncode({
        'type': 'refill',
        'med_id': medId,
      }),
    );
  }

  /// Schedule a workout reminder
  Future<void> scheduleWorkoutReminder({
    required DateTime scheduledTime,
    String? customMessage,
  }) async {
    const notificationId = 999999; // Fixed ID for workout reminder

    final tzScheduledTime = tz.TZDateTime.from(scheduledTime, tz.local);

    const androidDetails = AndroidNotificationDetails(
      'workout_reminders',
      'Workout Reminders',
      channelDescription: 'Daily workout reminders',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails(
      presentSound: true,
      presentAlert: true,
      presentBadge: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.zonedSchedule(
      notificationId,
      '💪 Time to Work Out!',
      customMessage ?? 'Your body is ready. Let\'s crush this workout!',
      tzScheduledTime,
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time,
      payload: jsonEncode({'type': 'workout'}),
    );
  }

  /// Show achievement unlocked notification
  Future<void> showAchievementNotification({
    required String achievementName,
    required String description,
    required int xpReward,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'achievements',
      'Achievements',
      channelDescription: 'Achievement unlocked notifications',
      importance: Importance.high,
      priority: Priority.high,
      styleInformation: BigTextStyleInformation(''),
    );

    const iosDetails = DarwinNotificationDetails(
      presentSound: true,
      presentAlert: true,
      presentBadge: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      '🏆 Achievement Unlocked!',
      '$achievementName - +$xpReward XP',
      details,
      payload: jsonEncode({'type': 'achievement'}),
    );
  }

  /// Show streak milestone notification
  Future<void> showStreakNotification(int streakDays) async {
    await _notifications.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      '🔥 Streak Milestone!',
      'You\'re on a $streakDays day streak! Keep it going!',
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'achievements',
          'Achievements',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(
          presentSound: true,
          presentAlert: true,
        ),
      ),
    );
  }

  /// Handle notification tap
  static void _handleNotificationTap(NotificationResponse response) {
    if (response.payload == null) return;

    try {
      final data = jsonDecode(response.payload!);
      final type = data['type'] as String?;

      if (type == 'medication') {
        _handleMedicationAction(response.actionId, data);
      }
    } catch (e) {
      debugPrint('Error handling notification tap: $e');
    }
  }

  /// Handle background notification tap
  @pragma('vm:entry-point')
  static void _handleBackgroundNotificationTap(NotificationResponse response) {
    _handleNotificationTap(response);
  }

  /// Handle medication notification actions
  static void _handleMedicationAction(String? actionId, Map<String, dynamic> data) {
    final medId = data['med_id'] as String?;
    final scheduleId = data['schedule_id'] as String?;

    if (medId == null || scheduleId == null) return;

    switch (actionId) {
      case 'take':
        // TODO: Log medication as taken
        debugPrint('Medication taken: $medId');
        break;
      case 'snooze':
        // TODO: Snooze medication reminder
        final snoozeDuration = data['snooze_duration'] as int? ?? 10;
        debugPrint('Medication snoozed for $snoozeDuration minutes: $medId');
        break;
      case 'skip':
        // TODO: Log medication as skipped
        debugPrint('Medication skipped: $medId');
        break;
    }
  }

  /// Format meal timing for display
  String _formatMealTiming(String mealTiming) {
    switch (mealTiming) {
      case 'before_meal':
        return 'Before meal';
      case 'with_meal':
        return 'With meal';
      case 'after_meal':
        return 'After meal';
      case 'empty_stomach':
        return 'On empty stomach';
      default:
        return '';
    }
  }

  /// Get pending notifications
  Future<List<PendingNotificationRequest>> getPendingNotifications() async {
    return await _notifications.pendingNotificationRequests();
  }

  /// Cancel a specific notification
  Future<void> cancel(int id) async {
    await _notifications.cancel(id);
  }

  /// Cancel all notifications
  Future<void> cancelAll() async {
    await _notifications.cancelAll();
  }
}
