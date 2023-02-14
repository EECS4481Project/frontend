import Cookies from 'js-cookie'
import jwt_decode from "jwt-decode";

/**
 * Returns a JSON of {username: str, firstName: str, lastName: str, isAdmin: boolean}
 * if a user is signed in. Otherwise returns null.
 */
export const getSignedInAgent = () => {
    const auth_cookie = Cookies.get("auth");
    if (auth_cookie) {
        return jwt_decode(auth_cookie);
    }
    return null;
}