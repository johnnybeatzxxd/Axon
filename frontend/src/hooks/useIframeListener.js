// src/hooks/useIframeListener.js

import { useEffect } from 'react';

export const useIframeListener = (onMessage) => {
  useEffect(() => {
    console.log("started listining!!")
    // This is the function that will run every time a message comes in
    const handleMessage = (event) => {

      // For security, it's good to check where the message came from.
      // If you are using `srcDoc`, the origin will be 'null'.

      // If the origin is correct, call your function with the data
      onMessage(event.data);
      console.log('hey')
    };

    // Tell the browser to start listening for messages
    window.addEventListener('message', handleMessage);

    // IMPORTANT: Clean up the listener when the component is removed
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onMessage]); // This ensures the hook updates if your onMessage function changes
};
