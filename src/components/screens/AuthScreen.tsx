import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase-client';
import { api } from '../../lib/api';
import { toast } from 'sonner@2.0.3';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { userCode } = useParams<{ userCode: string }>();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanName = name.trim();
    
    try {
      if (isLogin) {
        // ============================================
        // LOGIN FLOW - Fetch user code from database
        // ============================================
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (error) throw error;
        
        // Fetch user code from database (source of truth)
        const userId = signInData.user.id;
        const { data: ownershipData, error: fetchError } = await supabase
          .from('user_code_ownership')
          .select('user_code')
          .eq('user_id', userId)
          .single();

        if (fetchError || !ownershipData) {
          console.error('Failed to fetch user code:', fetchError);
          toast.error('Failed to load your profile. Please contact support.');
          throw new Error('User code not found');
        }

        // Store user code in localStorage for quick access
        const userCode = ownershipData.user_code;
        localStorage.setItem('user_code', userCode);
        
        toast.success('Logged in successfully');
        
        // Navigate to correct studio with database user code
        navigate(`/${userCode}/studio`);
        return; // Exit early for login flow
        
      } else {
        // ============================================
        // SIGNUP FLOW - Already correct
        // ============================================
        // Signup flow (Client-side with database trigger):
        // 1. api.auth.signup creates user and waits for trigger
        // 2. Database trigger automatically creates user code and business card
        // 3. Returns the generated user code
        // 4. Navigate to studio
        
        const signupResponse = await api.auth.signup(cleanEmail, cleanPassword, cleanName);
        
        // Store the generated user code from signup
        if (signupResponse.userCode) {
          localStorage.setItem('user_code', signupResponse.userCode);
        }
        
        toast.success('Account created successfully');
        
        // Navigate to studio with the new user code
        navigate(`/${signupResponse.userCode}/studio`);
        return; // Exit early for signup flow
      }
      
    } catch (error: any) {
      console.error('Auth error:', error);
      
      if (error.message?.includes("Invalid login credentials")) {
         toast.error("Invalid email or password. Please check your credentials.");
      } else if (error.message?.includes("User already registered")) {
         toast.error("This email is already registered. Please sign in.");
         setIsLogin(true);
      } else if (error.message?.includes("User code not found")) {
         toast.error("Profile not found. Please contact support.");
      } else {
         toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#e9e6dc] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Sign in to manage your digital business card' 
              : 'Get started with your digital business card studio'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="Jane Doe" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="jane@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground mt-4">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}