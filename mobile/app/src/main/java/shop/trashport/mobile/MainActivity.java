package shop.trashport.mobile;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

public final class MainActivity extends Activity {
    static final int WEB_ID = 1001, ERROR_ID = 1002, RETRY_ID = 1003;
    private static final int LOCATION_REQUEST = 40;
    private static final String HOME = "https://trashport.shop/";
    private WebView web;
    private LinearLayout errorPanel;
    private TextView errorText;
    private ProgressBar progress;
    private String retryUrl = HOME;
    private GeolocationPermissions.Callback locationCallback;
    private String locationOrigin;
    private boolean locationApproved;
    private boolean failed;

    // Required by the Django maps/UI; no native JS bridge and only trusted top-level pages.
    @android.annotation.SuppressLint("SetJavaScriptEnabled")
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout root = new FrameLayout(this);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        web = new WebView(this);
        web.setId(WEB_ID);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        root.addView(progress, new FrameLayout.LayoutParams(-1, 8, Gravity.TOP));
        errorPanel = new LinearLayout(this);
        errorPanel.setId(ERROR_ID);
        errorPanel.setOrientation(LinearLayout.VERTICAL);
        errorPanel.setGravity(Gravity.CENTER);
        errorPanel.setPadding(32, 32, 32, 32);
        errorPanel.setBackgroundColor(0xfff4f8f5);
        errorText = new TextView(this);
        errorText.setGravity(Gravity.CENTER);
        errorText.setTextSize(19);
        errorPanel.addView(errorText);
        Button retry = new Button(this);
        retry.setId(RETRY_ID);
        retry.setText(R.string.retry);
        retry.setOnClickListener(view -> load(retryUrl));
        errorPanel.addView(retry);
        errorPanel.setVisibility(View.GONE);
        root.addView(errorPanel, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        WebView.setWebContentsDebuggingEnabled(false);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSafeBrowsingEnabled(true);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setGeolocationEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                UrlPolicy.Action action = UrlPolicy.classify(url);
                if (action == UrlPolicy.Action.INTERNAL) return false;
                if (request.isForMainFrame() && action == UrlPolicy.Action.EXTERNAL && request.hasGesture()) {
                    openBrowser(url);
                } else if (request.isForMainFrame()) {
                    showError("This navigation was blocked for your safety. Use Back or Retry.");
                }
                return true;
            }
            @Override public void onPageStarted(WebView view, String url, Bitmap favicon) {
                denyPendingLocation();
                if (UrlPolicy.classify(url) != UrlPolicy.Action.INTERNAL) {
                    view.stopLoading();
                    showError("Only TrashPort HTTPS pages can open inside this app.");
                    return;
                }
                retryUrl = url;
                failed = false;
                errorPanel.setVisibility(View.GONE);
                progress.setVisibility(View.VISIBLE);
            }
            @Override public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
                CookieManager.getInstance().flush();
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showError("Unable to connect to TrashPort. Check your connection, then retry.");
            }
            @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() && response.getStatusCode() >= 400)
                    showError("TrashPort returned an error (" + response.getStatusCode() + "). Please retry later.");
            }
            @Override public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.cancel();
                showError("Secure connection failed. Check your device clock or try again later. Certificates are never bypassed.");
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int value) { progress.setProgress(value); }
            @Override public void onPermissionRequest(PermissionRequest request) { request.deny(); }
            @Override public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                denyPendingLocation();
                if (failed || !UrlPolicy.canRequestLocation(origin, web.getUrl())) {
                    callback.invoke(origin, false, false);
                    return;
                }
                locationOrigin = origin;
                locationCallback = callback;
                if (checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[] {Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION}, LOCATION_REQUEST);
                } else {
                    askSiteLocation();
                }
            }
            @Override public void onGeolocationPermissionsHidePrompt() { denyPendingLocation(); }
        });
        if (state == null || web.restoreState(state) == null
                || UrlPolicy.classify(web.getUrl()) != UrlPolicy.Action.INTERNAL) load(HOME);
    }
    private void openBrowser(String url) {
        try {
            Intent browser = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            browser.addCategory(Intent.CATEGORY_BROWSABLE);
            startActivity(browser);
        } catch (ActivityNotFoundException missingBrowser) {
            Toast.makeText(this, "No browser available to open this HTTPS link.", Toast.LENGTH_LONG).show();
        }
    }
    private void load(String url) {
        failed = false;
        errorPanel.setVisibility(View.GONE);
        progress.setVisibility(View.VISIBLE);
        web.loadUrl(UrlPolicy.classify(url) == UrlPolicy.Action.INTERNAL ? url : HOME);
    }
    void showError(String message) {
        failed = true;
        denyPendingLocation();
        progress.setVisibility(View.GONE);
        errorText.setText(message);
        errorPanel.setVisibility(View.VISIBLE);
    }
    private void askSiteLocation() {
        if (locationCallback == null) return;
        if (locationApproved) { finishLocation(true); return; }
        new android.app.AlertDialog.Builder(this)
                .setTitle("Share location with TrashPort?")
                .setMessage("Allow https://trashport.shop to use your location for site maps during this app session? You can deny and still use the site.")
                .setPositiveButton("Allow", (dialog, which) -> { locationApproved = true; finishLocation(true); })
                .setNegativeButton("Deny", (dialog, which) -> finishLocation(false))
                .setOnCancelListener(dialog -> finishLocation(false)).show();
    }
    private void finishLocation(boolean allow) {
        if (locationCallback != null) {
            boolean trusted = !failed && UrlPolicy.canRequestLocation(locationOrigin, web.getUrl());
            boolean permission = checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
            locationCallback.invoke(locationOrigin, allow && trusted && permission, false);
            locationCallback = null;
            locationOrigin = null;
        }
    }
    private void denyPendingLocation() { finishLocation(false); }
    @Override public void onRequestPermissionsResult(int request, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(request, permissions, results);
        if (request == LOCATION_REQUEST) {
            if (checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) askSiteLocation();
            else finishLocation(false);
        }
    }
    @Override public void onBackPressed() {
        if (errorPanel.getVisibility() == View.VISIBLE) { load(HOME); return; }
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
    @Override protected void onSaveInstanceState(Bundle state) { web.saveState(state); super.onSaveInstanceState(state); }
    @Override protected void onPause() { web.onPause(); CookieManager.getInstance().flush(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() { denyPendingLocation(); web.destroy(); super.onDestroy(); }
}
