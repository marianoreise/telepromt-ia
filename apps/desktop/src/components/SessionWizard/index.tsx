// SessionWizard/index.tsx — Container del wizard de creación de sesión

import { useState } from 'react';
import type { SessionConfig, WizardStep } from '../../types';
import { Step1Company } from './Step1Company';
import { Step2Config } from './Step2Config';

interface SessionWizardProps {
  config: Partial<SessionConfig>;
  onChange: (partial: Partial<SessionConfig>) => void;
  onFinish: () => void;
  onBack: () => void;
}

export function SessionWizard({ config, onChange, onFinish, onBack }: SessionWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);

  const handleStep1Next = () => {
    setStep(2);
  };

  const handleStep2Back = () => {
    setStep(1);
  };

  if (step === 1) {
    return (
      <Step1Company
        config={config}
        onChange={onChange}
        onNext={handleStep1Next}
        onBack={onBack}
      />
    );
  }

  return (
    <Step2Config
      config={config}
      onChange={onChange}
      onNext={onFinish}
      onBack={handleStep2Back}
    />
  );
}
