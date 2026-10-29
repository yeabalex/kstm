"use client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect } from "react";
import { Check, Loader2, ArrowUpRight } from "lucide-react";

type LoadingState = {
  text: string;
};

export const MultiStepLoader = ({
  loadingStates,
  loading,
  curr,
  progress,
  statusText,
  onContinueInBackground,
}: {
  loadingStates: LoadingState[];
  loading?: boolean;
  curr: number;
  loop?: boolean;
  progress?: number;
  statusText?: string;
  onContinueInBackground?: () => void;
}) => {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }
    setCurrentState(Math.max(0, curr));
  }, [curr, loading]);

  const computedProgress =
    typeof progress === "number"
      ? Math.min(100, Math.max(0, Math.round(progress)))
      : Math.min(
          95,
          Math.round(((currentState + 0.5) / Math.max(loadingStates.length, 1)) * 100)
        );

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-zinc-950/30 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-xl shadow-lg p-6">
            {/* Header + Percentage */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-950">
                  Provisioning Assistant
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {statusText || "Indexing knowledge sources in the background..."}
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-zinc-900 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md">
                {computedProgress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-zinc-900 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.max(4, computedProgress)}%` }}
              />
            </div>

            {/* Step List */}
            <div className="space-y-2.5">
              {loadingStates.map((step, index) => {
                const isCompleted = index < currentState || computedProgress === 100;
                const isActive = index === currentState && computedProgress < 100;

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg border text-xs transition-colors",
                      isActive
                        ? "bg-zinc-50 border-zinc-200/90 text-zinc-950 font-medium"
                        : isCompleted
                        ? "bg-white border-transparent text-zinc-600"
                        : "bg-white border-transparent text-zinc-400"
                    )}
                  >
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      {isCompleted ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                        </div>
                      ) : isActive ? (
                        <Loader2 className="w-3.5 h-3.5 text-zinc-900 animate-spin" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-zinc-200" />
                      )}
                    </div>
                    <span className="truncate">{step.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Non-blocking Background Escape Hatch */}
            {onContinueInBackground && (
              <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-400">
                  Runs asynchronously on worker queue
                </span>
                <button
                  type="button"
                  onClick={onContinueInBackground}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors"
                >
                  <span>Continue in background</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

