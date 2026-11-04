package shop.trashport.mobile;

import android.app.Activity;
import android.content.Intent;
import android.test.InstrumentationTestCase;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;

public final class MainActivityTest extends InstrumentationTestCase {
    private Activity activity;
    private void launch() {
        Intent intent = new Intent(getInstrumentation().getTargetContext(), MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        activity = getInstrumentation().startActivitySync(intent);
    }
    public void testSecureSettingsAndProductionLaunch() throws Throwable {
        launch();
        runTestOnUiThread(() -> {
            WebView web = activity.findViewById(MainActivity.WEB_ID);
            WebSettings settings = web.getSettings();
            assertTrue(settings.getJavaScriptEnabled());
            assertFalse(settings.getAllowFileAccess());
            assertFalse(settings.getAllowContentAccess());
            assertEquals(WebSettings.MIXED_CONTENT_NEVER_ALLOW, settings.getMixedContentMode());
            assertTrue(settings.getSafeBrowsingEnabled());
            assertFalse(settings.supportMultipleWindows());
            assertTrue(web.getUrl().startsWith("https://trashport.shop/"));
        });
    }
    public void testOfflinePanelRetryAndBack() throws Throwable {
        launch();
        runTestOnUiThread(() -> {
            MainActivity main = (MainActivity) activity;
            main.showError("Offline test");
            assertEquals(View.VISIBLE, main.findViewById(MainActivity.ERROR_ID).getVisibility());
            Button retry = main.findViewById(MainActivity.RETRY_ID);
            retry.performClick();
            assertEquals(View.GONE, main.findViewById(MainActivity.ERROR_ID).getVisibility());
            main.showError("Offline test");
            main.onBackPressed();
            assertEquals(View.GONE, main.findViewById(MainActivity.ERROR_ID).getVisibility());
        });
    }
    @Override protected void tearDown() throws Exception {
        if (activity != null) activity.finish();
        super.tearDown();
    }
}
