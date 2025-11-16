import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Bell, Lock, Palette, Mic, Video, Globe,
  Shield, HelpCircle, Info, ChevronRight
} from 'lucide-react';
import { Card, Input, Button } from '@voicecast/ui';

interface SettingSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const settingSections: SettingSection[] = [
  {
    id: 'profile',
    title: 'Profile',
    icon: <User className="w-5 h-5" />,
    description: 'Manage your profile information',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: <Bell className="w-5 h-5" />,
    description: 'Configure notification preferences',
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: <Lock className="w-5 h-5" />,
    description: 'Control your privacy and security settings',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: <Palette className="w-5 h-5" />,
    description: 'Customize your interface',
  },
  {
    id: 'audio',
    title: 'Audio Settings',
    icon: <Mic className="w-5 h-5" />,
    description: 'Configure audio devices and quality',
  },
  {
    id: 'streaming',
    title: 'Streaming',
    icon: <Video className="w-5 h-5" />,
    description: 'Stream quality and settings',
  },
];

export const SettingsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState({
    profile: {
      displayName: 'JazzMaster',
      email: 'jazz@example.com',
      bio: 'Professional jazz musician',
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      streamAlerts: true,
      chatMentions: true,
    },
    privacy: {
      profileVisible: true,
      showOnlineStatus: true,
      allowMessages: true,
    },
    appearance: {
      theme: 'dark',
      language: 'en',
    },
    audio: {
      inputDevice: 'default',
      outputDevice: 'default',
      sampleRate: '48000',
      bitrate: '320',
    },
  });

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Profile Settings</h2>

      <Input
        label="Display Name"
        value={settings.profile.displayName}
        onChange={(e) =>
          setSettings({
            ...settings,
            profile: { ...settings.profile, displayName: e.target.value },
          })
        }
        placeholder="Enter your display name"
      />

      <Input
        label="Email"
        type="email"
        value={settings.profile.email}
        onChange={(e) =>
          setSettings({
            ...settings,
            profile: { ...settings.profile, email: e.target.value },
          })
        }
        placeholder="your.email@example.com"
      />

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Bio
        </label>
        <textarea
          value={settings.profile.bio}
          onChange={(e) =>
            setSettings({
              ...settings,
              profile: { ...settings.profile, bio: e.target.value },
            })
          }
          rows={4}
          className="w-full px-4 py-3 bg-bg-secondary rounded-xl border border-border-default focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-text-primary resize-none"
          placeholder="Tell us about yourself..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="primary" size="md">
          Save Changes
        </Button>
        <Button variant="ghost" size="md">
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Notification Settings</h2>

      <div className="space-y-4">
        {Object.entries(settings.notifications).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl"
          >
            <div>
              <p className="font-medium text-text-primary">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </p>
              <p className="text-sm text-text-tertiary mt-1">
                Receive notifications for this event
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      [key]: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-tertiary rounded-full peer peer-checked:bg-brand-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Privacy & Security</h2>

      <div className="space-y-4">
        {Object.entries(settings.privacy).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl"
          >
            <div>
              <p className="font-medium text-text-primary">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    privacy: {
                      ...settings.privacy,
                      [key]: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-tertiary rounded-full peer peer-checked:bg-brand-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
        ))}
      </div>

      <Card variant="elevated" className="bg-semantic-warning/10 border-semantic-warning/20">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-semantic-warning flex-shrink-0 mt-1" />
          <div>
            <p className="font-medium text-text-primary mb-1">Two-Factor Authentication</p>
            <p className="text-sm text-text-secondary mb-3">
              Add an extra layer of security to your account
            </p>
            <Button variant="secondary" size="sm">
              Enable 2FA
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Appearance</h2>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Theme
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['dark', 'light', 'auto'].map((theme) => (
            <button
              key={theme}
              onClick={() =>
                setSettings({
                  ...settings,
                  appearance: { ...settings.appearance, theme },
                })
              }
              className={`p-4 rounded-xl border-2 transition-all ${
                settings.appearance.theme === theme
                  ? 'border-brand-primary bg-brand-primary/10'
                  : 'border-border-default hover:border-border-strong'
              }`}
            >
              <div className="font-medium text-text-primary capitalize">{theme}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Language
        </label>
        <select
          value={settings.appearance.language}
          onChange={(e) =>
            setSettings({
              ...settings,
              appearance: { ...settings.appearance, language: e.target.value },
            })
          }
          className="w-full px-4 py-3 bg-bg-secondary rounded-xl border border-border-default focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-text-primary"
        >
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
      </div>
    </div>
  );

  const renderAudioSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Audio Settings</h2>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Input Device
        </label>
        <select
          value={settings.audio.inputDevice}
          onChange={(e) =>
            setSettings({
              ...settings,
              audio: { ...settings.audio, inputDevice: e.target.value },
            })
          }
          className="w-full px-4 py-3 bg-bg-secondary rounded-xl border border-border-default focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-text-primary"
        >
          <option value="default">Default Microphone</option>
          <option value="usb">USB Microphone</option>
          <option value="bluetooth">Bluetooth Headset</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Sample Rate
        </label>
        <select
          value={settings.audio.sampleRate}
          onChange={(e) =>
            setSettings({
              ...settings,
              audio: { ...settings.audio, sampleRate: e.target.value },
            })
          }
          className="w-full px-4 py-3 bg-bg-secondary rounded-xl border border-border-default focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-text-primary"
        >
          <option value="44100">44.1 kHz</option>
          <option value="48000">48 kHz (Recommended)</option>
          <option value="96000">96 kHz (High Quality)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Bitrate
        </label>
        <select
          value={settings.audio.bitrate}
          onChange={(e) =>
            setSettings({
              ...settings,
              audio: { ...settings.audio, bitrate: e.target.value },
            })
          }
          className="w-full px-4 py-3 bg-bg-secondary rounded-xl border border-border-default focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-text-primary"
        >
          <option value="128">128 kbps</option>
          <option value="192">192 kbps</option>
          <option value="256">256 kbps</option>
          <option value="320">320 kbps (Best Quality)</option>
        </select>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'privacy':
        return renderPrivacySettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'audio':
        return renderAudioSettings();
      default:
        return <div>Select a section</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-3">
            <Card padding="sm">
              <div className="space-y-1">
                {settingSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeSection === section.id
                        ? 'bg-brand-primary text-white'
                        : 'text-text-tertiary hover:bg-surface-tertiary hover:text-text-primary'
                    }`}
                  >
                    {section.icon}
                    <span className="flex-1 text-left font-medium">{section.title}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Content */}
          <div className="col-span-9">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card>{renderContent()}</Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
