import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.json';

@freezed
class User with _$User {
  const factory User({
    required String userId,
    required String email,
    String? fullName,
    DateTime? dateOfBirth,
    double? heightCm,
    double? weightKg,
    String? gender,
    String? fitnessGoal, // 'strength', 'hypertrophy', 'endurance', 'weight_loss'
    String? experienceLevel, // 'beginner', 'intermediate', 'advanced'
    @Default('en') String preferredLanguage,
    String? timezone,
    @Default('free') String subscriptionTier, // 'free', 'premium'
    DateTime? subscriptionEndsAt,
    DateTime? createdAt,
    DateTime? lastActiveAt,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}

@freezed
class UserSettings with _$UserSettings {
  const factory UserSettings({
    required String userId,
    @Default(true) bool notificationsEnabled,
    String? workoutReminderTime, // Format: "HH:mm"
    @Default(3) int weeklyGoalWorkouts,
    @Default('metric') String unitsSystem, // 'metric', 'imperial'
    @Default(false) bool privacyShareWorkouts,
    @Default(false) bool privacyShareProgress,
  }) = _UserSettings;

  factory UserSettings.fromJson(Map<String, dynamic> json) =>
      _$UserSettingsFromJson(json);
}

@freezed
class UserStats with _$UserStats {
  const factory UserStats({
    required String userId,
    @Default(0) int totalWorkouts,
    @Default(0.0) double totalVolumeKg,
    @Default(0) int totalMinutes,
    @Default(0) int currentStreak,
    @Default(0) int longestStreak,
    DateTime? lastWorkoutDate,
    @Default(0) int totalXp,
    @Default(1) int level,
    @Default(0) int medicationsTakenCount,
    @Default(0.0) double medicationsAdherenceRate,
  }) = _UserStats;

  factory UserStats.fromJson(Map<String, dynamic> json) =>
      _$UserStatsFromJson(json);
}

@freezed
class Achievement with _$Achievement {
  const factory Achievement({
    required String achievementId,
    required String code,
    required String name,
    String? description,
    String? category, // 'milestone', 'performance', 'consistency', 'social'
    String? iconUrl,
    int? xpReward,
    Map<String, dynamic>? condition,
  }) = _Achievement;

  factory Achievement.fromJson(Map<String, dynamic> json) =>
      _$AchievementFromJson(json);
}

@freezed
class UserAchievement with _$UserAchievement {
  const factory UserAchievement({
    required String userId,
    required String achievementId,
    Achievement? achievement, // Populated achievement data
    DateTime? unlockedAt,
  }) = _UserAchievement;

  factory UserAchievement.fromJson(Map<String, dynamic> json) =>
      _$UserAchievementFromJson(json);
}

/// Extension for fitness goal
extension FitnessGoalExtension on String {
  String get displayName {
    switch (this) {
      case 'strength':
        return 'Build Strength';
      case 'hypertrophy':
        return 'Build Muscle';
      case 'endurance':
        return 'Improve Endurance';
      case 'weight_loss':
        return 'Lose Weight';
      default:
        return this;
    }
  }

  String get emoji {
    switch (this) {
      case 'strength':
        return '💪';
      case 'hypertrophy':
        return '🏋️';
      case 'endurance':
        return '🏃';
      case 'weight_loss':
        return '⚖️';
      default:
        return '🎯';
    }
  }
}

/// Extension for experience level
extension ExperienceLevelExtension on String {
  String get displayName {
    switch (this) {
      case 'beginner':
        return 'Beginner';
      case 'intermediate':
        return 'Intermediate';
      case 'advanced':
        return 'Advanced';
      default:
        return this;
    }
  }
}
