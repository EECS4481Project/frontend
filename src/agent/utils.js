import jwtDecode from 'jwt-decode';

const authTokenLocalStorageKey = 'auth';

/**
 * Note: this can be spoofed on the front-end. Should only be used for
 * UI.
 * @returns a JSON of {username: str, firstName: str, lastName: str, isAdmin: boolean}
 * if a user is signed in. Otherwise null.
 */
export const getSignedInAgent = () => {
  const auth = getSignedInAgentAuthToken();
  if (auth) {
    return jwtDecode(auth);
  }
  return null;
};

/**
 * Get the JWT auth token. (Possibly spoofed)
 * @returns string if found, null otherwise.
 */
export const getSignedInAgentAuthToken = () => localStorage.getItem(authTokenLocalStorageKey);

/**
 * Sets the signed in agent auth token.
 */
export const setSignedInAgentAuthToken = (authToken) => {
  localStorage.setItem(authTokenLocalStorageKey, authToken);
};

/**
 * Deletes the signed in agents auth token.
 */
export const deleteSignedInAgentAuthToken = () => {
  localStorage.removeItem(authTokenLocalStorageKey);
};

export const checkPasswordRequirements = (password) => {
  let lowercaseCount = 0;
  let uppercaseCount = 0;
  let numberCount = 0;
  let symbolCount = 0;
  let lastChar = '';
  let duplicateCount = 0;
  let isDuplicate = true;
  for (let i = 0; i < password.length; i++) {
    if (password.charCodeAt(i) >= 'a'.charCodeAt(0)
      && password.charCodeAt(i) <= 'z'.charCodeAt(0)) {
      lowercaseCount += 1;
    } else if (password.charCodeAt(i) >= 'A'.charCodeAt(0)
      && password.charCodeAt(i) <= 'Z'.charCodeAt(0)) {
      uppercaseCount += 1;
    } else if (password.charCodeAt(i) >= '0'.charCodeAt(0)
      && password.charCodeAt(i) <= '9'.charCodeAt(0)) {
      numberCount += 1;
    } else {
      symbolCount += 1;
    }
    if (password[i] === lastChar) {
      duplicateCount++;
    } else {
      duplicateCount = 0;
      lastChar = password[i];
    }
    if (duplicateCount > 2) {
      isDuplicate = false;
    }
  }
  return {
    lowercase: { met: lowercaseCount >= 1, text: 'At least 1 lowercase letter.' },
    uppercase: { met: uppercaseCount >= 1, text: 'At least 1 uppercase letter.' },
    number: { met: numberCount >= 1, text: 'At least 1 number.' },
    symbol: { met: symbolCount >= 1, text: 'At least 1 symbol.' },
    length: { met: password.length >= 8, text: 'At least 8 characters.' },
    duplicate: { met: isDuplicate , text: 'No more than 3 of the same character in a row' },
    requirements: ['lowercase', 'uppercase', 'number', 'symbol', 'length', 'duplicate'],
  };
};
