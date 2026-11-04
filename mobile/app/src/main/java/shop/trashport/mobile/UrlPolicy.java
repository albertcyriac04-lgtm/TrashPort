package shop.trashport.mobile;

final class UrlPolicy {
    enum Action { INTERNAL, EXTERNAL, BLOCK }
    static boolean canRequestLocation(String origin, String topLevelUrl) {
        return classify(origin) == Action.INTERNAL && classify(topLevelUrl) == Action.INTERNAL;
    }
    static Action classify(String url) {
        if (url == null) return Action.BLOCK;
        try {
            java.net.URI uri = new java.net.URI(url);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
                    || uri.getRawUserInfo() != null || uri.getPort() > 65535
                    || uri.getPort() == 0) return Action.BLOCK;
            boolean sameOrigin = "trashport.shop".equalsIgnoreCase(uri.getHost())
                    && (uri.getPort() == -1 || uri.getPort() == 443);
            return sameOrigin ? Action.INTERNAL : Action.EXTERNAL;
        } catch (java.net.URISyntaxException invalid) {
            return Action.BLOCK;
        }
    }
}
