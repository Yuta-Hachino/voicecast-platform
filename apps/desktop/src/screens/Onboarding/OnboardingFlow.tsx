import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, User, Mic, Bell, Check, ChevronRight, ChevronLeft
} from 'lucide-react';
import { Button, Input, Card } from '@voicecast/ui';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to VoiceCast',
    description: 'The premier platform for high-quality audio streaming',
    icon: <Radio className="w-16 h-16" />,
  },
  {
    id: 'profile',
    title: 'Create Your Profile',
    description: 'Tell us a bit about yourself',
    icon: <User className="w-16 h-16" />,
  },
  {
    id: 'audio',
    title: 'Audio Setup',
    description: 'Configure your audio devices',
    icon: <Mic className="w-16 h-16" />,
  },
  {
    id: 'notifications',
    title: 'Stay Connected',
    description: 'Choose your notification preferences',
    icon: <Bell className="w-16 h-16" />,
  },
  {
    id: 'complete',
    title: "You're All Set!",
    description: 'Start exploring amazing streams',
    icon: <Check className="w-16 h-16" />,
  },
];

export const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    audioInput: 'default',
    notifications: {
      email: true,
      push: true,
    },
  });

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    console.log('Onboarding complete!', formData);
    // Navigate to main app
  };

  const renderStepContent = () => {
    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-32 h-32 mx-auto bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center"
            >
              {step.icon}
            </motion.div>

            <div className="space-y-3">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                {step.title}
              </h2>
              <p className="text-xl text-text-secondary max-w-md mx-auto">
                {step.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-8">
              <div className="p-6 bg-surface-secondary rounded-xl">
                <div className="w-12 h-12 bg-brand-primary/20 rounded-lg flex items-center justify-center mb-3 mx-auto">
                  <Radio className="w-6 h-6 text-brand-primary" />
                </div>
                <h3 className="font-semibold mb-2">Ultra-Quality Audio</h3>
                <p className="text-sm text-text-tertiary">
                  Experience crystal-clear audio with up to 510kbps bitrate
                </p>
              </div>

              <div className="p-6 bg-surface-secondary rounded-xl">
                <div className="w-12 h-12 bg-brand-primary/20 rounded-lg flex items-center justify-center mb-3 mx-auto">
                  <User className="w-6 h-6 text-brand-primary" />
                </div>
                <h3 className="font-semibold mb-2">Connect with Creators</h3>
                <p className="text-sm text-text-tertiary">
                  Follow your favorite broadcasters and engage in real-time
                </p>
              </div>

              <div className="p-6 bg-surface-secondary rounded-xl">
                <div className="w-12 h-12 bg-brand-primary/20 rounded-lg flex items-center justify-center mb-3 mx-auto">
                  <Mic className="w-6 h-6 text-brand-primary" />
                </div>
                <h3 className="font-semibold mb-2">Start Broadcasting</h3>
                <p className="text-sm text-text-tertiary">
                  Share your voice with the world in just a few clicks
                </p>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center mb-4">
                {step.icon}
              </div>
              <h2 className="text-3xl font-bold mb-2">{step.title}</h2>
              <p className="text-text-secondary">{step.description}</p>
            </div>

            <Input
              label="Username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              helperText="This will be your unique identifier"
            />

            <Input
              label="Display Name"
              placeholder="Enter your display name"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              helperText="This is how others will see you"
            />

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Bio (Optional)
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-bg-secondary rounded-xl border border-border-default focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-text-primary resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center mb-4">
                {step.icon}
              </div>
              <h2 className="text-3xl font-bold mb-2">{step.title}</h2>
              <p className="text-text-secondary">{step.description}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Microphone
              </label>
              <select
                value={formData.audioInput}
                onChange={(e) =>
                  setFormData({ ...formData, audioInput: e.target.value })
                }
                className="w-full px-4 py-3 bg-bg-secondary rounded-xl border border-border-default focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-text-primary"
              >
                <option value="default">Default Microphone</option>
                <option value="usb">USB Microphone</option>
                <option value="bluetooth">Bluetooth Headset</option>
              </select>
            </div>

            <Card variant="glass" className="p-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-semantic-info/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mic className="w-6 h-6 text-semantic-info" />
                </div>
                <div>
                  <p className="font-medium text-text-primary mb-1">Audio Tip</p>
                  <p className="text-sm text-text-secondary">
                    For the best quality, use a dedicated USB microphone and ensure
                    you're in a quiet environment.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center mb-4">
                {step.icon}
              </div>
              <h2 className="text-3xl font-bold mb-2">{step.title}</h2>
              <p className="text-text-secondary">{step.description}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl">
                <div>
                  <p className="font-medium text-text-primary">Email Notifications</p>
                  <p className="text-sm text-text-tertiary mt-1">
                    Receive updates about your account and streams
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifications.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          email: e.target.checked,
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-tertiary rounded-full peer peer-checked:bg-brand-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl">
                <div>
                  <p className="font-medium text-text-primary">Push Notifications</p>
                  <p className="text-sm text-text-tertiary mt-1">
                    Get notified when your followed streamers go live
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifications.push}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          push: e.target.checked,
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-tertiary rounded-full peer peer-checked:bg-brand-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-32 h-32 mx-auto bg-gradient-to-br from-semantic-success to-brand-primary rounded-full flex items-center justify-center"
            >
              {step.icon}
            </motion.div>

            <div className="space-y-3">
              <h2 className="text-4xl font-bold">{step.title}</h2>
              <p className="text-xl text-text-secondary max-w-md mx-auto">
                {step.description}
              </p>
            </div>

            <Card variant="glass" className="max-w-md mx-auto">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-semantic-success/20 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-semantic-success" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Profile Created</p>
                    <p className="text-sm text-text-tertiary">@{formData.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-semantic-success/20 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-semantic-success" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Audio Configured</p>
                    <p className="text-sm text-text-tertiary">{formData.audioInput}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-semantic-success/20 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-semantic-success" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Notifications Set</p>
                    <p className="text-sm text-text-tertiary">
                      {formData.notifications.email && formData.notifications.push
                        ? 'All enabled'
                        : 'Partially enabled'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Button
              size="lg"
              onClick={handleComplete}
              className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-glow"
            >
              Start Exploring
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {steps.map((s, index) => (
              <div
                key={s.id}
                className={`flex-1 h-2 mx-1 rounded-full transition-all ${
                  index <= currentStep
                    ? 'bg-brand-primary'
                    : 'bg-surface-tertiary'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-text-tertiary">
            <span>Step {currentStep + 1} of {steps.length}</span>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-surface-primary rounded-2xl p-12 border border-border-subtle mb-8"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {!isLastStep && (
          <div className="flex justify-between">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleBack}
              disabled={isFirstStep}
              icon={<ChevronLeft />}
            >
              Back
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={handleNext}
              icon={<ChevronRight />}
              iconPosition="right"
            >
              {isLastStep ? 'Complete' : 'Continue'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
