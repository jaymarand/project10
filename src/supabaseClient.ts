import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zsblwmwvlwzrqrupvlvx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYmx3bXd2bHd6cnFydXB2bHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzMzc3ODAsImV4cCI6MjA0NjkxMzc4MH0.H4ITCvnYoIz0IZofNp0gQKOH74PnuhstD13bHcfvYaI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
