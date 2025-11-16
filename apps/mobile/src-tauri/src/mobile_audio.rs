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
