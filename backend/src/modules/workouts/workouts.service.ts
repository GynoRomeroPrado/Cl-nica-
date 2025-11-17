import { Injectable } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';

@Injectable()
export class WorkoutsService {
  private supabase = SupabaseConfig.getClient();

  async getWorkouts(userId: string, limit = 20, offset = 0) {
    const { data, error } = await this.supabase
      .from('workouts')
      .select('*, workout_exercises(*, exercise:exercises(*))')
      .eq('user_id', userId)
      .order('workout_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  async getWorkoutById(workoutId: string) {
    const { data, error } = await this.supabase
      .from('workouts')
      .select('*, workout_exercises(*, exercise:exercises(*), workout_sets(*))')
      .eq('workout_id', workoutId)
      .single();

    if (error) throw error;
    return data;
  }

  async createWorkout(userId: string, workoutData: any) {
    const { data, error } = await this.supabase
      .from('workouts')
      .insert({ ...workoutData, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateWorkout(workoutId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('workouts')
      .update(updates)
      .eq('workout_id', workoutId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteWorkout(workoutId: string) {
    const { error } = await this.supabase
      .from('workouts')
      .delete()
      .eq('workout_id', workoutId);

    if (error) throw error;
    return { message: 'Workout deleted successfully' };
  }
}
