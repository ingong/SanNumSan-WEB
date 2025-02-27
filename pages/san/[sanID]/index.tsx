import BeforeIcon from '@/assets/icon/icon_before.svg';
import CheckIcon from '@/assets/icon/icon_check.svg';
import DownloadIcon from '@/assets/icon/icon_download.svg';
import NextIcon from '@/assets/icon/icon_next.svg';
import ProceedIcon from '@/assets/icon/icon_proceed.svg';
import ShareIcon from '@/assets/icon/icon_share.svg';
import LogoGreen from '@/assets/img/logo_green.png';
import BottomSheetModal from '@/component/BottomSheetModal/BottomSheetModal';
import FloatingModal from '@/component/FloatingModal/FloatingModal';
import { BaseHead } from '@/component/Head/Head';
import Header from '@/component/Header/Header';
import { SanDetailGridView } from '@/component/SanDetailGridView/SanDetailGridView';
import { api } from '@/service/api';
import { RemoteSanData } from '@/service/api/types/san';
import { getCanvasImageCropValues, getDateString } from '@/service/misc';
// import domtoimage from 'dom-to-image';
import { saveAs } from 'file-saver';
import type { GetServerSidePropsContext } from 'next';
import Image from 'next/image';
import React from 'react';

function SanDetail({ sanData }: { sanData: RemoteSanData }) {
  const { name, height, length, defaultImage } = sanData;
  const [image, setImage] = React.useState(defaultImage);
  const [comment, setComment] = React.useState('');
  const [editState, setEditState] = React.useState<
    'idle' | 'edit-modal-view' | 'write-bottomsheet-view' | 'save-modal-view' | 'share-modal-view' | 'complete'
  >('idle');
  const cardRef = React.createRef<HTMLDivElement>();
  const imageInputRef = React.createRef<HTMLInputElement>();
  const triggerImageBoxOpen = () => {
    imageInputRef.current?.dispatchEvent(new MouseEvent('click'));
  };

  const onImageInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const target = e.target as HTMLInputElement;
      if (!target.files) return;
      const file: File = (target.files as FileList)[0];
      setImage(URL.createObjectURL(file));
    } catch (err) {
      console.error(err);
    }
  };

  // const getCardBlob = async () => {
  //   if (!cardRef.current) return undefined;
  //   const scale = 3;
  //   const cardBlob = await domtoimage.toBlob(cardRef.current, {
  //     width: cardRef.current.clientWidth * scale,
  //     height: cardRef.current.clientHeight * scale,
  //     style: {
  //       transform: 'scale(' + scale + ')',
  //       transformOrigin: 'top left',
  //     },
  //   });
  //   return cardBlob;
  // };

  const getCardBlob2 = async () => {
    const scaler = 3;
    return new Promise<null | Blob>((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 316 * scaler;
      canvas.height = 316 * scaler;
      const canvasContext = canvas.getContext('2d');
      if (canvasContext) {
        fetch(image)
          .then((sanImageSource) => sanImageSource.blob())
          .then((sanImageBlob) => createImageBitmap(sanImageBlob))
          .then((sanImage) => {
            const { shiftX, shiftY, imageCropWidth, imageCropHeight } = getCanvasImageCropValues(
              316 * scaler,
              316 * scaler,
              sanImage.width,
              sanImage.height,
            );
            canvasContext.drawImage(
              sanImage,
              shiftX,
              shiftY,
              imageCropWidth,
              imageCropHeight,
              0,
              0,
              316 * scaler,
              316 * scaler,
            );
            canvasContext.font = `bold ${20 * scaler}px 'Pretendard'`;
            canvasContext.fillStyle = 'white';
            canvasContext.fillText(getDateString(new Date()), 22 * scaler, 212 * scaler);
            canvasContext.fillText(length.toString() + 'km', 22 * scaler, 243 * scaler);
            canvasContext.fillText(height.toString() + 'm', 22 * scaler, 274 * scaler);
            canvas.toBlob((blob) => {
              resolve(blob);
            });
          });
      } else resolve(null);
    });
  };

  const saveCard = async () => {
    try {
      const cardBlob = await getCardBlob2();
      if (!cardBlob) return;
      saveAs(cardBlob, `${name}.png`);
    } catch (err) {
      console.log(err);
    }
  };

  const shareCard = async () => {
    if (navigator.share) {
      navigator.share({
        url: `${window.location.href}/1`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.href}/1`);
      //alert('공유하기가 지원되지 않는 환경 입니다.');
    }
  };

  const postSaveCard = () => {
    console.log('send post request to remote server');
    setEditState('complete');
  };

  return (
    <main>
      <BaseHead title={name} />
      <Header />
      <section className="san-detail">
        <SanDetailGridView {...sanData} />
        <div className="image-wrapper">
          <Image
            src={image}
            alt={name}
            layout="responsive"
            width="100%"
            height="100%"
            objectFit="cover"
            onClick={triggerImageBoxOpen}
          />
          <input type="file" accept="image/*" ref={imageInputRef} onChange={onImageInput} />
        </div>
        {comment.length !== 0 && <div className="comment-wrapper">{comment}</div>}
        <div className="button-wrapper">
          <ShareIcon onClick={() => setEditState('share-modal-view')} />
          <div />
          {editState === 'complete' ? (
            <DownloadIcon onClick={() => setEditState('save-modal-view')} />
          ) : (
            <ProceedIcon onClick={() => setEditState('edit-modal-view')} />
          )}
        </div>
      </section>
      {(editState === 'edit-modal-view' || editState === 'write-bottomsheet-view') && (
        <FloatingModal onCloseButtonClick={() => setEditState('idle')}>
          <div className="edit-modal-header">
            <Image src={LogoGreen} alt="sannumsan" width={50} height={50} />
            <div>{name}</div>
          </div>
          <div className="edit-modal-image-wrapper">
            <div className="edit-modal-image" ref={cardRef}>
              <Image
                src={image}
                alt="thumbnail image"
                layout="responsive"
                width="100%"
                height="100%"
                objectFit="cover"
              />
              <div className="edit-modal-image-info">
                <div>{getDateString(new Date())}</div>
                <div>{length}km</div>
                <div>{height}m</div>
              </div>
            </div>
          </div>
          <div onClick={() => setEditState('write-bottomsheet-view')}>
            {comment.length === 0 ? (
              <div className="edit-modal-comment-empty">⛰ 등산 기록을 남겨보세요! ⛰</div>
            ) : (
              <div className="edit-modal-comment">{comment}</div>
            )}
          </div>
          <div className="modal-bottom edit-modal-bottom">
            <div onClick={() => setEditState('idle')}>
              <BeforeIcon />
            </div>
            <div />
            {comment.length === 0 ? (
              <div onClick={() => setEditState('write-bottomsheet-view')}>
                <NextIcon />
              </div>
            ) : (
              <div onClick={postSaveCard}>
                <CheckIcon />
              </div>
            )}
          </div>
        </FloatingModal>
      )}
      {editState === 'write-bottomsheet-view' && (
        <BottomSheetModal
          onChangeText={(text: string) => {
            setComment(text);
            setEditState('edit-modal-view');
          }}
          closeBottomSheet={() => setEditState('idle')}
        />
      )}
      {(editState === 'save-modal-view' || editState === 'share-modal-view') && (
        <FloatingModal onCloseButtonClick={() => setEditState('idle')}>
          <div className="edit-modal-header">
            <Image src={LogoGreen} alt="sannumsan" width={50} height={50} />
            <div>{name}</div>
          </div>
          <div className="edit-modal-image-wrapper">
            <div className="edit-modal-image" ref={cardRef}>
              <Image
                src={image}
                alt="thumbnail image"
                layout="responsive"
                width="100%"
                height="100%"
                objectFit="cover"
              />
              <div className="edit-modal-image-info">
                <div>{getDateString(new Date())}</div>
                <div>{length}km</div>
                <div>{height}m</div>
              </div>
            </div>
          </div>
          <div className="edit-modal-comment">{comment}</div>
          {editState === 'save-modal-view' ? (
            <div className="modal-bottom save-modal-bottom" onClick={saveCard}>
              <div className="save-modal-save-button">저장하기</div>
            </div>
          ) : (
            <div className="modal-bottom save-modal-bottom" onClick={shareCard}>
              <div className="save-modal-save-button">공유하기</div>
            </div>
          )}
        </FloatingModal>
      )}
    </main>
  );
}

export async function getServerSideProps({ params }: GetServerSidePropsContext) {
  const id = +(params?.sanID ?? -1);
  const response = await api.sanService.getSanDetail(id);
  return { props: { sanData: response } };
}

export default SanDetail;
