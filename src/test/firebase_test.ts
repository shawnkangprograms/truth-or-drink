import remoteConfig from '@react-native-firebase/remote-config';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';

export async function runFirebaseTest() {
  // Remote Config
  await remoteConfig().fetchAndActivate();
  const version = remoteConfig().getString('content_version');
  console.log('✅ Remote Config content_version:', version);

  // Analytics (just log an event)
  await analytics().logEvent('day2_test', { status: 'ok' });
  console.log('✅ Analytics test event sent');

  // Crashlytics (do NOT crash right now; just confirm it's alive)
  await crashlytics().log('Day2 test: Crashlytics is working');
  console.log('✅ Crashlytics log sent');
}