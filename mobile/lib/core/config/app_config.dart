/// Application configuration constants
class AppConfig {
  // Supabase Configuration
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://your-project.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'your-anon-key-here',
  );

  // API Configuration
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api',
  );

  static const String mlServiceUrl = String.fromEnvironment(
    'ML_SERVICE_URL',
    defaultValue: 'http://localhost:8000',
  );

  // ExerciseDB API (RapidAPI)
  static const String rapidApiKey = String.fromEnvironment(
    'RAPIDAPI_KEY',
    defaultValue: 'your-rapidapi-key',
  );

  static const String exerciseDbUrl =
      'https://exercisedb.p.rapidapi.com/exercises';

  // NewsAPI Configuration
  static const String newsApiKey = String.fromEnvironment(
    'NEWS_API_KEY',
    defaultValue: 'your-newsapi-key',
  );

  static const String newsApiUrl = 'https://newsapi.org/v2';

  // PubMed API Configuration
  static const String pubmedApiKey = String.fromEnvironment(
    'PUBMED_API_KEY',
    defaultValue: '', // Optional
  );

  static const String pubmedBaseUrl =
      'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

  // ZenQuotes API
  static const String zenQuotesUrl = 'https://zenquotes.io/api';

  // App Settings
  static const String appName = 'Health & Fitness';
  static const String appVersion = '1.0.0';
  static const String supportEmail = 'support@healthapp.com';
  static const String privacyEmail = 'privacy@healthapp.com';

  // Cache Durations
  static const Duration quoteCacheDuration = Duration(hours: 24);
  static const Duration newsCacheDuration = Duration(hours: 12);
  static const Duration exerciseCacheDuration = Duration(days: 7);

  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;

  // Workout Settings
  static const int defaultRestSeconds = 90;
  static const int maxSetsPerExercise = 10;
  static const int maxExercisesPerWorkout = 20;

  // Medication Settings
  static const int defaultSnoozeDuration = 10; // minutes
  static const int maxMedicationsPerUser = 50;
  static const int defaultRefillReminderDays = 7;

  // Gamification
  static const int xpPerWorkout = 50;
  static const int xpPerMedTaken = 10;
  static const int xpForStreak = 100;
  static const int levelUpXpMultiplier = 100; // Level N needs N * 100 XP

  // Rate Limiting
  static const int maxRequestsPer15Min = 100;

  // File Upload
  static const int maxImageSizeMB = 5;
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif'];

  // Feature Flags
  static const bool enableSocialFeatures = true;
  static const bool enablePoseDetection = false; // Phase 2
  static const bool enableARWorkouts = false; // Phase 3
  static const bool enableWearableSync = false; // Phase 3

  // Analytics
  static const bool enableAnalytics = true;
  static const bool enableCrashReporting = true;

  // Development
  static const bool isProduction = bool.fromEnvironment('PRODUCTION', defaultValue: false);
  static const bool enableDebugLogs = !isProduction;
}
