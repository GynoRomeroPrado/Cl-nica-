import 'package:freezed_annotation/freezed_annotation.dart';

part 'exercise.freezed.dart';
part 'exercise.g.json';

@freezed
class Exercise with _$Exercise {
  const factory Exercise({
    required String exerciseId,
    String? externalId, // ExerciseDB ID
    required String name,
    String? description,
    List<String>? instructions,
    String? imageUrl,
    String? videoUrl,
    String? gifUrl,
    @Default([]) List<String> equipment,
    @Default([]) List<String> bodyParts,
    @Default([]) List<String> targetMuscles,
    @Default([]) List<String> secondaryMuscles,
    String? difficulty, // 'beginner', 'intermediate', 'advanced'
    String? category, // 'strength', 'cardio', 'flexibility'
    DateTime? createdAt,
  }) = _Exercise;

  factory Exercise.fromJson(Map<String, dynamic> json) =>
      _$ExerciseFromJson(json);
}

@freezed
class Workout with _$Workout {
  const factory Workout({
    required String workoutId,
    required String userId,
    required DateTime workoutDate,
    String? workoutType, // 'strength', 'cardio', 'mixed'
    int? durationMinutes,
    double? totalVolume, // kg * reps summed
    int? caloriesBurned,
    int? avgHeartRate,
    String? notes,
    @Default(true) bool completed,
    @Default([]) List<WorkoutExercise> exercises,
    DateTime? createdAt,
  }) = _Workout;

  factory Workout.fromJson(Map<String, dynamic> json) =>
      _$WorkoutFromJson(json);
}

@freezed
class WorkoutExercise with _$WorkoutExercise {
  const factory WorkoutExercise({
    required String workoutExerciseId,
    required String workoutId,
    required String exerciseId,
    Exercise? exercise, // Populated exercise data
    required int exerciseOrder,
    int? setsCompleted,
    String? notes,
    @Default([]) List<WorkoutSet> sets,
  }) = _WorkoutExercise;

  factory WorkoutExercise.fromJson(Map<String, dynamic> json) =>
      _$WorkoutExerciseFromJson(json);
}

@freezed
class WorkoutSet with _$WorkoutSet {
  const factory WorkoutSet({
    required String setId,
    required String workoutExerciseId,
    required int setNumber,
    double? weightKg,
    int? reps,
    int? repsInReserve, // RIR: 0-5
    int? durationSeconds, // For cardio/planks
    double? distanceMeters, // For running/rowing
    int? restSeconds,
    @Default(true) bool completed,
    double? volume, // Calculated: weight * reps
  }) = _WorkoutSet;

  factory WorkoutSet.fromJson(Map<String, dynamic> json) =>
      _$WorkoutSetFromJson(json);
}

@freezed
class WorkoutTemplate with _$WorkoutTemplate {
  const factory WorkoutTemplate({
    required String templateId,
    required String userId,
    required String name,
    String? description,
    Map<String, dynamic>? exercises, // JSON structure
    @Default(false) bool isPublic,
    @Default(0) int timesUsed,
  }) = _WorkoutTemplate;

  factory WorkoutTemplate.fromJson(Map<String, dynamic> json) =>
      _$WorkoutTemplateFromJson(json);
}

/// Extension for difficulty level
extension DifficultyExtension on String {
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

  String get emoji {
    switch (this) {
      case 'beginner':
        return '🟢';
      case 'intermediate':
        return '🟡';
      case 'advanced':
        return '🔴';
      default:
        return '⚪';
    }
  }
}

/// Extension for workout type
extension WorkoutTypeExtension on String {
  String get displayName {
    switch (this) {
      case 'strength':
        return 'Strength';
      case 'cardio':
        return 'Cardio';
      case 'mixed':
        return 'Mixed';
      case 'flexibility':
        return 'Flexibility';
      default:
        return this;
    }
  }

  String get emoji {
    switch (this) {
      case 'strength':
        return '💪';
      case 'cardio':
        return '🏃';
      case 'mixed':
        return '🔥';
      case 'flexibility':
        return '🧘';
      default:
        return '🏋️';
    }
  }
}
