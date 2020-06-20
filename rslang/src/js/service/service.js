import { urls, errorTypes } from '../constants/constants';

const {
  WORDS_DATA_URL,
  CREATE_USER_URL,
  LOGIN_USER_URL,
  GET_USER_URL,
} = urls;

const {
  USER_ALREADY_EXISTS,
  ERROR_417,
} = errorTypes;

const getWords = async (page = 0, group = 0) => {
  const response = await fetch(`${WORDS_DATA_URL}page=${page}&group=${group}`);
  const data = await response.json();

  return data;
};

<<<<<<< HEAD
export default getWords;
=======
const createUser = async (user) => {
  const rawResponse = await fetch(CREATE_USER_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });

  if (rawResponse.status === ERROR_417) {
    throw new Error(USER_ALREADY_EXISTS);
  }

  const content = await rawResponse.json();
  return content;
};

const loginUser = async (user) => {
  const rawResponse = await fetch(LOGIN_USER_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });

  if (rawResponse.status === ERROR_417) {
    throw new Error(USER_ALREADY_EXISTS);
  }

  const content = await rawResponse.json();
  return content;
};

const getUserById = async (id, token) => {
  const response = await fetch(`${GET_USER_URL}${id}`, {
    method: 'GET',
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  const content = await response.json();

  return content;
};

export {
  getWords,
  createUser,
  loginUser,
  getUserById,
};
>>>>>>> develop
