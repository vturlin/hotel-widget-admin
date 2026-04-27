import TopChrome from './TopChrome.jsx';
import TabBar from './TabBar.jsx';
import PreviewPane from './PreviewPane.jsx';
import styles from './AdminLayout.module.css';

export default function AdminLayout({
  hotelId,
  hotelName,
  onBackToHotels,
  unpublishedCount,
  canAct,
  onPreviewLive,
  onPublish,
  activeTab,
  onTabChange,
  preview,
  children,
}) {
  return (
    <div className={styles.shell}>
      <TopChrome
        hotelId={hotelId}
        hotelName={hotelName}
        onBackToHotels={onBackToHotels}
        unpublishedCount={unpublishedCount}
        canAct={canAct}
        onPreviewLive={onPreviewLive}
        onPublish={onPublish}
      />
      <TabBar activeTab={activeTab} onTabChange={onTabChange} />
      <div className={styles.main}>
        <div className={styles.preview}>
          <PreviewPane {...preview} />
        </div>
        <aside className={styles.aside}>{children}</aside>
      </div>
    </div>
  );
}
