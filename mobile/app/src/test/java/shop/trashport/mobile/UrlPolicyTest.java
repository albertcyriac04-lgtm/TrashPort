package shop.trashport.mobile;

public final class UrlPolicyTest {
    private static int assertions;
    private static void check(boolean condition, String message) {
        assertions++;
        if (!condition) throw new AssertionError(message);
    }
    public static void main(String[] args) {
        check(UrlPolicy.classify("https://trashport.shop/") == UrlPolicy.Action.INTERNAL,
                "Production HTTPS origin must open internally");
        for (String url : new String[] {"https://trashport.shop/accounts/login/?next=%2Fmap%2F", "https://TRASHPORT.SHOP:443/map/#here"}) {
            check(UrlPolicy.classify(url) == UrlPolicy.Action.INTERNAL, "Same-origin path: " + url);
        }
        for (String url : new String[] {"https://example.com/", "https://trashport.shop.evil.test/", "https://sub.trashport.shop/", "https://trashport.shop:8443/"}) {
            check(UrlPolicy.classify(url) == UrlPolicy.Action.EXTERNAL, "External HTTPS: " + url);
        }
        for (String url : new String[] {null, "", "not a URL", "http://trashport.shop/", "javascript:alert(1)", "file:///etc/passwd", "content://test", "intent://example", "data:text/html,hi", "https://user@trashport.shop/", "https://trashport.shop\\\\@evil.test/", "//trashport.shop/", "https://", "https://example.com:99999/"}) {
            check(UrlPolicy.classify(url) == UrlPolicy.Action.BLOCK, "Unsafe URL: " + url);
        }
        check(UrlPolicy.canRequestLocation("https://trashport.shop/", "https://trashport.shop/map/"), "Trusted map may ask for location");
        check(!UrlPolicy.canRequestLocation("https://example.com/", "https://trashport.shop/"), "Third-party frame denied");
        check(!UrlPolicy.canRequestLocation("https://trashport.shop/", "https://example.com/"), "Untrusted top-level denied");
        check(!UrlPolicy.canRequestLocation(null, "https://trashport.shop/"), "Missing origin denied");
        System.out.println("URL policy: " + assertions + " assertions passed");
    }
}
