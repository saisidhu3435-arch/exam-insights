import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useSavePreferences, useGetPreferences } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { useSessionId } from "@/hooks/use-session";
import type { PreferencesInputGoal, PreferencesInputTimeMode } from "@workspace/api-client-react/src/generated/api.schemas";
import { Target, BookOpen, Globe, Clock, Zap, Coffee } from "lucide-react";
import logoImg from "@assets/5e08dcec-6c6d-4c5a-a3e2-3f47109160f2_1776317432015.png";

export function OnboardingPage() {
  const [, setLocation] = useLocation();
  const sessionId = useSessionId();
  const [step, setStep] = useState(1);
  
  const { data: preferences } = useGetPreferences();
  
  const [goal, setGoal] = useState<PreferencesInputGoal | null>(null);
  const [timeMode, setTimeMode] = useState<PreferencesInputTimeMode | null>(null);

  useEffect(() => {
    if (preferences) {
      if (preferences.goal) setGoal(preferences.goal);
      if (preferences.timeMode) setTimeMode(preferences.timeMode);
    }
  }, [preferences]);

  const savePreferences = useSavePreferences();

  const handleComplete = () => {
    if (goal && timeMode) {
      savePreferences.mutate(
        { data: { goal, timeMode, sessionId } },
        {
          onSuccess: () => {
            setLocation("/");
          }
        }
      );
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col p-6 bg-background max-w-md mx-auto w-full relative">
      <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-bottom-4 duration-500">
        
        <div className="mb-8 flex justify-center">
          <img src={logoImg} alt="Minute Ahead" className="h-10 w-auto" />
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2 text-center mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight">Why are you here?</h1>
              <p className="text-muted-foreground font-medium text-sm">Help us personalize your daily brief.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { setGoal("stay-updated"); setStep(2); }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${goal === "stay-updated" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <div className="bg-primary/10 text-primary p-3 rounded-full">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Stay Updated</h3>
                  <p className="text-sm text-muted-foreground">General news without the noise.</p>
                </div>
              </button>

              <button
                onClick={() => { setGoal("exams"); setStep(2); }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${goal === "exams" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <div className="bg-primary/10 text-primary p-3 rounded-full">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Exam Prep</h3>
                  <p className="text-sm text-muted-foreground">Focused on CLAT, AILET, etc.</p>
                </div>
              </button>

              <button
                onClick={() => { setGoal("general-knowledge"); setStep(2); }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${goal === "general-knowledge" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <div className="bg-primary/10 text-primary p-3 rounded-full">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">General Knowledge</h3>
                  <p className="text-sm text-muted-foreground">Learn something new daily.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2 text-center mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight">How much time do you have?</h1>
              <p className="text-muted-foreground font-medium text-sm">We'll adjust the depth of explanations.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { setTimeMode("2min"); setTimeMode("2min"); }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${timeMode === "2min" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <div className="bg-primary/10 text-primary p-3 rounded-full">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">2 minutes</h3>
                  <p className="text-sm text-muted-foreground">Just the core facts.</p>
                </div>
              </button>

              <button
                onClick={() => { setTimeMode("5min"); setTimeMode("5min"); }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${timeMode === "5min" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <div className="bg-primary/10 text-primary p-3 rounded-full">
                  <Coffee className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">5 minutes</h3>
                  <p className="text-sm text-muted-foreground">Balanced understanding.</p>
                </div>
              </button>

              <button
                onClick={() => { setTimeMode("10min"); setTimeMode("10min"); }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${timeMode === "10min" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <div className="bg-primary/10 text-primary p-3 rounded-full">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">10 minutes</h3>
                  <p className="text-sm text-muted-foreground">Deep dive into contexts.</p>
                </div>
              </button>
            </div>

            <div className="pt-8 flex gap-3">
              <Button variant="outline" className="flex-1 rounded-full h-12" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                className="flex-[2] rounded-full h-12 font-bold text-base" 
                disabled={!timeMode || savePreferences.isPending}
                onClick={handleComplete}
              >
                {savePreferences.isPending ? "Saving..." : "Start Reading"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
