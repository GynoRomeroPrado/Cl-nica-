import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/constants/app_theme.dart';

/// Splash screen shown on app launch
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    // Wait for splash animation
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;

    // Check if user is already authenticated
    final session = Supabase.instance.client.auth.currentSession;

    if (session != null) {
      // User is authenticated, navigate to home
      // TODO: Navigate to HomeScreen
      debugPrint('User authenticated: ${session.user.id}');
    } else {
      // User not authenticated, navigate to login
      // TODO: Navigate to LoginScreen
      debugPrint('User not authenticated');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppTheme.primaryGradient,
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // App Icon/Logo
              Icon(
                Icons.fitness_center_rounded,
                size: 120,
                color: Colors.white,
              )
                  .animate()
                  .scale(
                    duration: const Duration(milliseconds: 800),
                    curve: Curves.easeOutBack,
                  )
                  .fadeIn(duration: const Duration(milliseconds: 600)),

              const SizedBox(height: AppTheme.spacing24),

              // App Name
              Text(
                'Health & Fitness',
                style: Theme.of(context).textTheme.displayMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
              )
                  .animate()
                  .fadeIn(
                    delay: const Duration(milliseconds: 400),
                    duration: const Duration(milliseconds: 800),
                  )
                  .slideY(
                    begin: 0.3,
                    end: 0,
                    duration: const Duration(milliseconds: 800),
                    curve: Curves.easeOut,
                  ),

              const SizedBox(height: AppTheme.spacing8),

              // Tagline
              Text(
                'Your Health, Your Journey',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.white.withOpacity(0.9),
                    ),
              )
                  .animate()
                  .fadeIn(
                    delay: const Duration(milliseconds: 600),
                    duration: const Duration(milliseconds: 800),
                  )
                  .slideY(
                    begin: 0.3,
                    end: 0,
                    duration: const Duration(milliseconds: 800),
                    curve: Curves.easeOut,
                  ),

              const SizedBox(height: AppTheme.spacing48),

              // Loading indicator
              const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              )
                  .animate()
                  .fadeIn(
                    delay: const Duration(milliseconds: 800),
                    duration: const Duration(milliseconds: 600),
                  ),
            ],
          ),
        ),
      ),
    );
  }
}
