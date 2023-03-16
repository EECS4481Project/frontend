import jwtDecode from 'jwt-decode';

const LOCAL_STORAGE_QUEUE_KEY = 'queue';
const LOCAL_STORAGE_CHAT_AUTH_KEY = 'chat';

/**
 * Get the signed queue token.
 * @returns Queue token as a string if found, null otherwise.
 */
export const getQueueBypassToken = () => localStorage.getItem(LOCAL_STORAGE_QUEUE_KEY);

/**
 * Note: this can be spoofed on the front-end. Should only be used for
 * UI.
 * Returns a JSON of:
   {
            userId: string,
            firstName: string,
            lastName: string,
    }
 *  If the user has access to the priority queue.
 * @returns Queue token as a json if found, null otherwise.
 */
export const getQueueBypassTokenInfo = () => {
  const queueToken = getQueueBypassToken();
  if (queueToken) {
    return jwtDecode(queueToken);
  }
  return null;
};

/**
 * Get the signed chat auth token.
 * @returns Chat auth token as a string if found, null otherwise.
 */
export const getChatAuthToken = () => localStorage.getItem(LOCAL_STORAGE_CHAT_AUTH_KEY);

/**
 * Note: this can be spoofed on the front-end. Should only be used for
 * UI.
 * Returns a JSON of:
   {
            userId: string,
            firstName: string,
            lastName: string,
            agentUsername: string,
    }
    If the user has access to the chat
 * @returns Chat auth token as json if found. Null otherwise.
 */
export const getChatAuthTokenInfo = () => {
  const authToken = getChatAuthToken();
  if (authToken != null) {
    return jwtDecode(authToken);
  }
  return null;
};

export const deleteChatAuthToken = () => {
  localStorage.removeItem(LOCAL_STORAGE_CHAT_AUTH_KEY);
};

export const deleteQueueBypassToken = () => {
  localStorage.removeItem(LOCAL_STORAGE_QUEUE_KEY);
};

export const setChatAuthToken = (token) => {
  localStorage.setItem(LOCAL_STORAGE_CHAT_AUTH_KEY, token);
};

export const setQueueBypassToken = (token) => {
  localStorage.setItem(LOCAL_STORAGE_QUEUE_KEY, token);
};
