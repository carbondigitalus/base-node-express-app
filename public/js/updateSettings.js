/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

// Type is either 'password' or 'data' (data = name & email)
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    let reqData = {};

    for (var pair of data.entries()) {
      if (pair[1]) {
        reqData[pair[0]] = pair[1];
      }
    }

    const res = await axios({
      method: 'PATCH',
      url,
      data: reqData
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
      // window.setTimeout(() => {
      //   location.assign('/me');
      // }, 100);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
