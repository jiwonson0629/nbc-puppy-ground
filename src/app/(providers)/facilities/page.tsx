'use client';

import styles from './page.module.scss';
import { useEffect, useRef, useState } from 'react';
import {
  CustomOverlayMap,
  Map,
  MapInfoWindow,
  MapMarker,
  MapTypeControl,
  ZoomControl
} from 'react-kakao-maps-sdk';
import { MdMyLocation } from 'react-icons/md';
import { GiSittingDog } from 'react-icons/gi';
import { RiCalendarCloseFill } from 'react-icons/ri';
import { FaRegClock } from 'react-icons/fa';

import { useToast } from '@/hooks/useToast';
import { useFacilitiesQuery } from '@/hooks/useFacilitiesQuery';
import NearFacilities from '@/app/_components/facilities/NearFacilities';

const Facilities = () => {
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: 33.450701,
    longitude: 126.570667
  });

  // TODO: 컴포넌트화 시키기
  const [coordinate, setCoordinate] = useState<{ sw: number[]; ne: number[] }>({
    sw: [33.44653220300056, 126.56202403813722],
    ne: [33.45501290255946, 126.57927700861282]
  });
  const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);
  const [currentLocationMarker, setCurrentLocationMarker] = useState<boolean>(false);
  const { facilitiesData } = useFacilitiesQuery();
  const { warnTopCenter } = useToast();

  // map 이동 debouncing을 위한 timer 생성
  const timer = useRef<number | null>(null);

  // 현재위치로 가는 버튼
  const currentButtonHandler = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setCurrentLocationMarker(true);
        },
        () => {
          warnTopCenter({ message: '현재 위치를 찾지 못하였습니다 🥲' });
          setCurrentLocationMarker(false);
        }
      );
    }
  };

  // 장소이름 클릭 시 해당 마커로 이동
  const markerFocusHandler = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
    setCurrentLocation({
      latitude,
      longitude
    });
  };

  // 현재위치를 시작점으로 만들기
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setCurrentLocationMarker(true);
        },
        () => {
          setCurrentLocation({ latitude: 33.450701, longitude: 126.570667 });
        }
      );
    }
  }, []);

  // onBoundsChanged시 화면 이동 할때마다 데이터를 계속 받아와서 느려짐 -> 디바운싱 이용
  return (
    <div className={styles.mapContainer}>
      <div id="map" className={styles.mapWrap}>
        <Map
          center={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}
          level={3}
          style={{ width: '100%', height: '100%' }}
          onBoundsChanged={(map) => {
            // 디바운싱 구현
            if (timer.current) {
              clearTimeout(timer.current);
            }

            timer.current = window.setTimeout(() => {
              setCoordinate({
                sw: map
                  .getBounds()
                  .getSouthWest()
                  .toString()
                  .replace(/\(|\)/g, '')
                  .split(',')
                  .map(Number),
                ne: map
                  .getBounds()
                  .getNorthEast()
                  .toString()
                  .replace(/\(|\)/g, '')
                  .split(',')
                  .map(Number)
              });
            }, 1000);
          }}
        >
          {facilitiesData?.data!.map((place) => {
            return (
              <div key={place.id}>
                <MapMarker
                  position={{ lat: place.latitude, lng: place.longitude }}
                  onMouseOver={() => setActiveMarkerId(place.id)}
                  onMouseOut={() => setActiveMarkerId(null)}
                  image={{
                    // 마커이미지의 주소
                    src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
                    size: {
                      width: 24,
                      height: 35
                    }
                  }}
                />
                {activeMarkerId === place.id && (
                  <CustomOverlayMap
                    position={{ lat: place.latitude, lng: place.longitude }}
                    yAnchor={1}
                  >
                    <div className={styles.overlayWrap}>
                      <div className={styles.placeName}>{place.facilities_name}</div>
                      <div className={styles.placeContent}>
                        <p>
                          <GiSittingDog />
                          &nbsp;{place.explanation}
                        </p>
                        <p>
                          <RiCalendarCloseFill />
                          &nbsp;{place.holiday}
                        </p>
                        <p>
                          <FaRegClock />
                          &nbsp;{place.open_time}
                        </p>
                      </div>
                    </div>
                  </CustomOverlayMap>
                )}
              </div>
            );
          })}
          {currentLocationMarker && (
            <>
              <MapMarker
                position={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}
                image={{
                  // 마커이미지의 주소
                  src: 'https://i.ibb.co/DYzyv2q/pngegg.png',
                  size: {
                    width: 20,
                    height: 20
                  }
                }}
              />
              <MapInfoWindow
                position={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}
                removable={true}
              />
              <div>현재위치</div>
            </>
          )}
          <MapTypeControl position={'TOPRIGHT'} />
          <ZoomControl position={'RIGHT'} />
        </Map>
        <NearFacilities markerFocusHandler={markerFocusHandler} coordinate={coordinate} />
        <button className={styles.currentLocation} onClick={currentButtonHandler}>
          <MdMyLocation />
        </button>
      </div>
    </div>
  );
};

export default Facilities;
