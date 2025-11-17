import 'package:freezed_annotation/freezed_annotation.dart';

part 'medication.freezed.dart';
part 'medication.g.json';

@freezed
class Medication with _$Medication {
  const factory Medication({
    required String medId,
    required String userId,
    required String name,
    required String type, // 'prescription', 'supplement', 'vitamin', 'protein'
    required String dosage,
    String? instructions,
    required DateTime startDate,
    DateTime? endDate,
    DateTime? refillDate,
    int? refillQuantity,
    @Default(7) int refillReminderDays,
    String? colorHex,
    String? icon, // 'pill', 'capsule', 'liquid', 'powder'
    String? notes,
    @Default([]) List<MedicationSchedule> schedules,
    DateTime? createdAt,
  }) = _Medication;

  factory Medication.fromJson(Map<String, dynamic> json) =>
      _$MedicationFromJson(json);
}

@freezed
class MedicationSchedule with _$MedicationSchedule {
  const factory MedicationSchedule({
    required String scheduleId,
    required String medId,
    required String time, // Format: "HH:mm"
    required String frequency, // 'daily', 'weekly', 'every_x_days', 'as_needed'
    int? intervalDays,
    List<int>? daysOfWeek, // [1,2,3,4,5] = Mon-Fri
    String? mealTiming, // 'before_meal', 'with_meal', 'after_meal', 'empty_stomach', 'anytime'
    @Default(false) bool waterReminder,
    @Default(true) bool enabled,
    @Default('default') String notificationSound,
    @Default(10) int snoozeDurationMinutes,
  }) = _MedicationSchedule;

  factory MedicationSchedule.fromJson(Map<String, dynamic> json) =>
      _$MedicationScheduleFromJson(json);
}

@freezed
class MedicationLog with _$MedicationLog {
  const factory MedicationLog({
    required String logId,
    required String medId,
    String? scheduleId,
    required DateTime scheduledTime,
    DateTime? takenTime,
    required String status, // 'taken', 'missed', 'skipped', 'snoozed'
    @Default(0) int snoozeCount,
    String? notes,
    String? photoUrl,
    DateTime? createdAt,
  }) = _MedicationLog;

  factory MedicationLog.fromJson(Map<String, dynamic> json) =>
      _$MedicationLogFromJson(json);
}

/// Extension for medication type display
extension MedicationTypeExtension on String {
  String get displayName {
    switch (this) {
      case 'prescription':
        return 'Prescription';
      case 'supplement':
        return 'Supplement';
      case 'vitamin':
        return 'Vitamin';
      case 'protein':
        return 'Protein';
      default:
        return this;
    }
  }

  String get icon {
    switch (this) {
      case 'prescription':
        return '💊';
      case 'supplement':
        return '🔶';
      case 'vitamin':
        return '🌟';
      case 'protein':
        return '💪';
      default:
        return '💊';
    }
  }
}

/// Extension for meal timing display
extension MealTimingExtension on String {
  String get displayName {
    switch (this) {
      case 'before_meal':
        return 'Before meal';
      case 'with_meal':
        return 'With meal';
      case 'after_meal':
        return 'After meal';
      case 'empty_stomach':
        return 'On empty stomach';
      case 'anytime':
        return 'Anytime';
      default:
        return this;
    }
  }
}
