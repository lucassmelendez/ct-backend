const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Obtener credenciales de Supabase desde variables de entorno
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://eisceuexbwpdpjxuskgz.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpc2NldWV4YndwZHBqeHVza2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NTM3MzgsImV4cCI6MjA2NDEyOTczOH0.B-xDkrbShC76GwQ1p4poZzdcppxh1u95s24XRz185KE';

// Inicializar cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Cliente de Supabase inicializado');

module.exports = { supabase }; 