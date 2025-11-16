# ClaudeCode Team 4: Mobile & Admin Dashboard プロンプト

## 初期セットアッププロンプト

```
You are Team 4 responsible for Tauri Mobile implementation and comprehensive Admin Dashboard for VoiceCast platform.

## Your Mission
Build mobile apps and admin tools with:
1. Tauri Mobile for iOS/Android
2. Admin dashboard with full management features
3. Event management system
4. Content moderation tools
5. Analytics and reporting
6. User management system

## Part 1: Tauri Mobile Implementation

### Mobile Project Setup

```bash
# Initialize Tauri Mobile
cd apps
npm create tauri-app@latest mobile -- --template react-ts --mobile
cd mobile

# Install mobile-specific dependencies
npm install @capacitor/core @capacitor/ios @capacitor/android
npm install @capacitor/filesystem @capacitor/network @capacitor/push-notifications
npm install @capacitor/status-bar @capacitor/splash-screen
```

### iOS Configuration

Create `apps/mobile/ios/App/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>VoiceCast</string>
    <key>CFBundleDisplayName</key>
    <string>VoiceCast</string>
    <key>CFBundleIdentifier</key>
    <string>com.voicecast.app</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    
    <!-- Permissions -->
    <key>NSMicrophoneUsageDescription</key>
    <string>VoiceCast needs microphone access for audio streaming</string>
    <key>NSCameraUsageDescription</key>
    <string>VoiceCast needs camera access for profile photos</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>VoiceCast needs photo library access to upload images</string>
    
    <!-- Background Modes -->
    <key>UIBackgroundModes</key>
    <array>
        <string>audio</string>
        <string>fetch</string>
        <string>remote-notification</string>
        <string>voip</string>
    </array>
    
    <!-- Audio Session -->
    <key>UIRequiresPersistentWiFi</key>
    <true/>
    
    <!-- URL Schemes -->
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>voicecast</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

### Android Configuration

Create `apps/mobile/android/app/src/main/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.voicecast.app">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Audio features -->
    <uses-feature android:name="android.hardware.microphone" android:required="true" />
    <uses-feature android:name="android.hardware.audio.low_latency" />
    <uses-feature android:name="android.hardware.audio.pro" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true"
        android:allowBackup="false">

        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize"
            android:launchMode="singleTop"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <!-- Deep linking -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="voicecast" />
            </intent-filter>
        </activity>

        <!-- Audio Streaming Service -->
        <service
            android:name=".AudioStreamingService"
            android:foregroundServiceType="microphone|mediaPlayback"
            android:exported="false">
            <intent-filter>
                <action android:name="com.voicecast.ACTION_START_STREAM" />
                <action android:name="com.voicecast.ACTION_STOP_STREAM" />
            </intent-filter>
        </service>

        <!-- Push Notifications -->
        <service
            android:name=".FCMService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
    </application>
</manifest>
```

### Mobile Audio Service (Rust)

Create `apps/mobile/src-tauri/src/mobile_audio.rs`:

```rust
use tauri::api::notification::Notification;
use std::sync::{Arc, Mutex};

#[cfg(target_os = "android")]
use jni::{JNIEnv, JavaVM, objects::{JClass, JString}};

#[cfg(target_os = "ios")]
use objc::{msg_send, sel, sel_impl, class};

pub struct MobileAudioService {
    is_streaming: Arc<Mutex<bool>>,
    is_background: Arc<Mutex<bool>>,
    audio_session: Option<AudioSession>,
}

impl MobileAudioService {
    pub fn new() -> Self {
        Self {
            is_streaming: Arc::new(Mutex::new(false)),
            is_background: Arc::new(Mutex::new(false)),
            audio_session: None,
        }
    }

    #[cfg(target_os = "ios")]
    pub fn configure_ios_audio_session(&mut self) -> Result<(), String> {
        unsafe {
            let audio_session: *mut objc::runtime::Object = msg_send![
                class!(AVAudioSession),
                sharedInstance
            ];
            
            // Set category for recording and playback
            let category: *mut objc::runtime::Object = msg_send![
                class!(NSString),
                stringWithUTF8String: "AVAudioSessionCategoryPlayAndRecord\0".as_ptr()
            ];
            
            let _: () = msg_send![
                audio_session,
                setCategory: category
                mode: "AVAudioSessionModeVoiceChat"
                options: 0x01 | 0x04 // AllowBluetooth | DefaultToSpeaker
                error: 0 as *mut objc::runtime::Object
            ];
            
            // Activate session
            let _: () = msg_send![audio_session, setActive: true error: 0];
            
            Ok(())
        }
    }

    #[cfg(target_os = "android")]
    pub fn configure_android_audio(&mut self, env: JNIEnv) -> Result<(), String> {
        // Get AudioManager
        let audio_manager = env
            .call_static_method(
                "android/media/AudioManager",
                "getSystemService",
                "(Ljava/lang/String;)Ljava/lang/Object;",
                &[env.new_string("audio").unwrap().into()],
            )
            .map_err(|e| e.to_string())?;

        // Request audio focus
        let audio_focus_request = env
            .new_object(
                "android/media/AudioFocusRequest$Builder",
                "(I)V",
                &[1.into()], // AUDIOFOCUS_GAIN
            )
            .map_err(|e| e.to_string())?;

        // Set audio attributes for voice communication
        let audio_attributes = env
            .new_object(
                "android/media/AudioAttributes$Builder",
                "()V",
                &[],
            )
            .map_err(|e| e.to_string())?;

        env.call_method(
            audio_attributes,
            "setUsage",
            "(I)Landroid/media/AudioAttributes$Builder;",
            &[2.into()], // USAGE_VOICE_COMMUNICATION
        ).map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn start_background_streaming(&mut self) -> Result<(), String> {
        *self.is_background.lock().unwrap() = true;
        
        // Show persistent notification
        #[cfg(target_os = "android")]
        self.show_streaming_notification()?;
        
        // Configure audio for background
        #[cfg(target_os = "ios")]
        self.enable_background_audio()?;
        
        Ok(())
    }

    #[cfg(target_os = "android")]
    fn show_streaming_notification(&self) -> Result<(), String> {
        Notification::new("com.voicecast.app")
            .title("VoiceCast is streaming")
            .body("Tap to return to the app")
            .icon("microphone")
            .persistent(true)
            .show()
            .map_err(|e| e.to_string())
    }
}

// Tauri commands for mobile
#[tauri::command]
pub async fn mobile_start_stream(
    config: StreamConfig,
    state: tauri::State<'_, MobileAudioService>,
) -> Result<(), String> {
    let mut service = state.inner().clone();
    
    #[cfg(target_os = "ios")]
    service.configure_ios_audio_session()?;
    
    #[cfg(target_os = "android")]
    {
        // Get JNI environment
        let ctx = tauri::android::current_activity();
        service.configure_android_audio(ctx.env)?;
    }
    
    service.start_background_streaming().await?;
    
    Ok(())
}
```

### Mobile UI Components

Create `apps/mobile/src/components/MobileStreamControl.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { 
  Haptics, ImpactStyle 
} from '@capacitor/haptics';
import { 
  PushNotifications 
} from '@capacitor/push-notifications';
import { motion, useAnimation } from 'framer-motion';

export const MobileStreamControl: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    // Request notification permissions
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        PushNotifications.register();
      }
    });

    // Listen for audio levels
    const interval = setInterval(async () => {
      if (isStreaming) {
        const level = await invoke<number>('get_audio_level');
        setAudioLevel(level);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const handleStreamToggle = async () => {
    // Haptic feedback
    await Haptics.impact({ style: ImpactStyle.Medium });

    if (!isStreaming) {
      await invoke('mobile_start_stream', {
        config: {
          quality: 'high',
          bitrate: 256000,
          background: true,
        },
      });
      
      setIsStreaming(true);
      
      // Animate button
      controls.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.3 },
      });
    } else {
      await invoke('mobile_stop_stream');
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-black p-8">
      {/* Main Stream Button */}
      <motion.button
        animate={controls}
        whileTap={{ scale: 0.95 }}
        onClick={handleStreamToggle}
        className={`
          relative w-48 h-48 rounded-full flex items-center justify-center
          ${isStreaming 
            ? 'bg-red-500 shadow-red-500/50' 
            : 'bg-gradient-to-br from-purple-500 to-pink-500'
          } 
          shadow-2xl transition-all duration-300
        `}
      >
        {/* Pulse animation when streaming */}
        {isStreaming && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                delay: 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </>
        )}

        {/* Icon */}
        <svg
          className="w-20 h-20 text-white relative z-10"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          {isStreaming ? (
            <rect x="6" y="6" width="12" height="12" rx="2" />
          ) : (
            <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z M11 6c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V6z M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          )}
        </svg>
      </motion.button>

      {/* Stream Status */}
      <motion.div 
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          {isStreaming ? 'ON AIR' : 'Ready to Stream'}
        </h2>
        
        {isStreaming && (
          <div className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white/80">Broadcasting Live</span>
          </div>
        )}
      </motion.div>

      {/* Audio Level Indicator */}
      {isStreaming && (
        <motion.div 
          className="mt-8 w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-yellow-400"
              animate={{ width: `${audioLevel * 100}%` }}
              transition={{ duration: 0.05 }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};
```

## Part 2: Admin Dashboard Implementation

### Admin Dashboard Setup

```bash
# Create admin app
cd apps
npx create-next-app@latest admin --typescript --tailwind --app
cd admin

# Install admin dependencies
npm install @tanstack/react-table @tanstack/react-query
npm install recharts date-fns
npm install @radix-ui/react-select @radix-ui/react-tabs
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react
```

### Admin Dashboard Layout

Create `apps/admin/src/app/layout.tsx`:

```typescript
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Providers } from '@/providers';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
```

### Dashboard Overview

Create `apps/admin/src/app/dashboard/page.tsx`:

```typescript
import React from 'react';
import { 
  Users, Radio, DollarSign, TrendingUp, 
  AlertTriangle, Clock, Gift, MessageCircle 
} from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { RealtimeChart } from '@/components/RealtimeChart';
import { ActivityFeed } from '@/components/ActivityFeed';
import { TopStreamers } from '@/components/TopStreamers';

export default async function DashboardPage() {
  // Fetch real-time stats
  const stats = await fetchDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          change={stats.userGrowth}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Live Streams"
          value={stats.liveStreams}
          change={stats.streamGrowth}
          icon={Radio}
          color="green"
          realtime
        />
        <StatsCard
          title="Revenue (24h)"
          value={`$${stats.dailyRevenue}`}
          change={stats.revenueGrowth}
          icon={DollarSign}
          color="purple"
        />
        <StatsCard
          title="Active Now"
          value={stats.activeUsers}
          change={stats.activeGrowth}
          icon={TrendingUp}
          color="orange"
          realtime
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">User Activity</h2>
          <RealtimeChart
            endpoint="/api/analytics/user-activity"
            type="area"
            color="#6366F1"
          />
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Stream Performance</h2>
          <RealtimeChart
            endpoint="/api/analytics/stream-performance"
            type="line"
            color="#10B981"
          />
        </div>
      </div>

      {/* Tables and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopStreamers />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
```

### User Management

Create `apps/admin/src/app/users/page.tsx`:

```typescript
import { UserTable } from '@/components/UserTable';
import { UserFilters } from '@/components/UserFilters';
import { BulkActions } from '@/components/BulkActions';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <BulkActions />
      </div>

      <UserFilters />
      
      <UserTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'username', label: 'Username' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          { key: 'status', label: 'Status' },
          { key: 'createdAt', label: 'Joined' },
          { key: 'lastActive', label: 'Last Active' },
          { key: 'actions', label: 'Actions' },
        ]}
      />
    </div>
  );
}
```

### Stream Monitoring

Create `apps/admin/src/app/streams/monitoring/page.tsx`:

```typescript
import React from 'react';
import { StreamGrid } from '@/components/StreamGrid';
import { StreamFilters } from '@/components/StreamFilters';
import { ModerationQueue } from '@/components/ModerationQueue';

export default function StreamMonitoringPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Live Stream Monitoring</h1>

      <StreamFilters />

      {/* Live Stream Grid */}
      <StreamGrid />

      {/* Moderation Queue */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Moderation Queue</h2>
        <ModerationQueue />
      </div>
    </div>
  );
}
```

### Event Management

Create `apps/admin/src/app/events/page.tsx`:

```typescript
import { EventCalendar } from '@/components/EventCalendar';
import { CreateEventModal } from '@/components/CreateEventModal';
import { EventList } from '@/components/EventList';

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Event Management</h1>
        <CreateEventModal />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EventCalendar />
        </div>
        <div>
          <EventList />
        </div>
      </div>
    </div>
  );
}
```

## Critical Requirements

1. **Mobile Performance** - 60fps animations, < 100ms response
2. **Background Audio** - Seamless background streaming
3. **Admin Security** - Role-based access control
4. **Real-time Updates** - WebSocket for live data
5. **Scalable Dashboard** - Handle 10k+ concurrent streams

Start by implementing the mobile audio service, then create the admin dashboard with all management features.
```
