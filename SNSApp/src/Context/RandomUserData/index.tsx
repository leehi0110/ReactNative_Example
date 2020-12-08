import React, {createContext, useState, useEffect} from 'react';
import {Image} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';

import Loading from '~/Screens/Loading';

interface Props {
  cache?: boolean;
  children: JSX.Element | Array<JSX.Element>;
}

interface IRandomUserData {
  getMyFeed: (number?: number) => Array<IFeed>;
}

const RandomUserDataContext = createContext<IRandomUserData>({
  getMyFeed: (number: number = 10) => {
    return [];
  },
});

const RandomUserDataProvider = ({cache, children}: Props) => {
  const [userList, setUserList] = useState<Array<IUserProfile>>([]);
  const [descriptionList, setDescriptionList] = useState<Array<string>>([]);
  const [imageList, setImageList] = useState<Array<string>>([]);

  const getCacheData = async (key: string) => {
    const cacheData = await AsyncStorage.getItem(key);
    if (cache === false || cacheData === null) {
      return undefined;
    }

    const cacheList = JSON.parse(cacheData);

    if (cacheData.length ! ==25) {
      return undefined;
    }

    return cacheList;
  };

  const setCachedData = (key: string, data: Array<any>) => {
    AsyncStorage.setItem(key, JSON.stringify(data));
  };

  const setUser = async () => {
    const cachedData = await getCacheData('UserList');
    if(cachedData) {
      setUserList(cachedData);
      return;
    }

    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/dev-yakuza/users/master/api.json',
      );
      const data = await response.json();
      setUserList(data);
      setCachedData('UserList',data);
    }
    catch(e) {
      console.log(e);
    }
  };

  const setDescriptions = async () => {
    const cachedData = await getCacheData('DescriptionList');
    if(cachedData) {
      setDescriptionList(cachedData);
      return;
    }

    try {
      const response = await fetch (
        'https://opinionated-quotes-api.gigalixirapp.com/v1/quotes?rand=t&n=25',
      );
      const data = await response.json();

      let text = [];
      for (const index in data.quotes) {
        text.push(data.quotes[index].quote);
      }

      setDescriptionList(text);
      setCachedData('DescriptionList',text);
    }
    catch(e) {
      console.log(e);
    }
  };

  const setImages = async () => {
    const cachedData = await getCacheData('ImageList'); 
    if (cachedData) {
      if (Image.queryCache) {
        Image.queryCache(cachedData);
        cachedData.map((data: string) => {
          Image.prefetch(data);
        });
      }
      setImageList(cachedData);
      return ;
    }

    setTimeout(async () => {
      try {
        const response = await fetch('https://source.unsplash.com/random/');
        const data = response.url;
        if (imageList.indexOf(data) >= 0) {
          setImages();
          return;
        }
        setImageList([...imageList,data]);
      } catch (e) {
        console.log(e);
      }
    },400);
  };

  useEffect(() => {
    setUser();
    setDescriptions();
  },[]);

  useEffect(() => {
    if(imageList.length ! ==25) {
      setImages();
    } else {
      setCachedData('ImageList', imageList);
    }
  },[imageList]);

  const getImages = (): Array<string> => {
    let images: Array<string> = [];
    const count = Math.floor(Math.random()*4);

    for (let i=0; i <= count; i++){
      images.push(imageList[Math.floor(Math.random() * 24)]);
    }

    return images;
  };

  const getMyFeed = (number: number = 10): Array<IFeed> => {
    let feeds: Array<IFeed> = []
    
    for(let i=0;i<number;i++) {
      const user = userList[Math.floor(Math.random() * 24)];
      feeds.push({
        name: user.name,
        photo: user.photo,
        description: descriptionList[Math.floor(Math.random()* 24)],
        images: getImages(),
      });
    }
    return feeds;
  };

  console.log(
    `${userList.length} / ${descriptionList.length} / ${imageList.length}`
  );

  return (
    <RandomUserDataContext.Provider
      value={{
        getMyFeed,
      }}>
      {userList.length === 25 && descriptionList.length === 25 && imageList.length === 25
      ? (
        children
      )
      : (
        <Loading/>
      )}
    </RandomUserDataContext.Provider>
  );
};

export {RandomUserDataContext, RandomUserDataProvider};
