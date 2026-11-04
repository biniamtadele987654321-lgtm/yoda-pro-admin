import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../services/firebase";

const DataContext = createContext(null);
const defaultAdMobSettings = {
  adsEnabled: false,
  bannerAdUnitId: "",
  interstitialAdUnitId: "",
  interstitialFrequency: 3,
};
const adminsSeed = [
  { id: "a1", username: "admin", fullName: "Yoda Pro Admin", email: "admin@yodapro.com" },
];
const appsSeed = [
  {
    id: "app-demo",
    applicationId: "com.company.ashu",
    status: "Active",
    redirectUrl: "",
    serverKey: "DEMO_ONLY_SERVER_KEY_NOT_FOR_PRODUCTION",
    restApiKey: "DEMO_ONLY_REST_API_KEY_NOT_FOR_PRODUCTION",
  },
];

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeDate(value) {
  return value?.toDate ? value.toDate().toISOString() : value || "";
}

function mapCategory(snapshot) {
  const data = snapshot.data();
  return { ...data, id: snapshot.id, image: data.iconUrl || data.image || "" };
}

function mapNews(snapshot) {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    date: normalizeDate(data.date),
    category: data.categoryName || data.category || "",
    image: data.primaryImageUrl || data.image || "",
    secondaryImage: data.optionalImageUrl || data.secondaryImage || "",
    comments: data.commentsCount ?? data.comments ?? 0,
    type: data.contentType || data.type || "NEWS",
    content: data.description || data.content || "",
  };
}

function mapUser(snapshot) {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    name: data.name || data.displayName || "",
    avatar: data.avatar || data.photoUrl || "",
    status: data.status || "ENABLED",
  };
}

function mapComment(snapshot) {
  const data = snapshot.data();
  return { ...data, id: snapshot.id, date: normalizeDate(data.date || data.createdAt) };
}

function mapReport(snapshot) {
  const data = snapshot.data();
  return { ...data, id: snapshot.id, date: normalizeDate(data.date || data.createdAt) };
}

function mapNotification(snapshot) {
  return { ...snapshot.data(), id: snapshot.id };
}

const convertToBase64 = (file, maxWidth = 1000, maxHeight = Infinity) => new Promise((resolve, reject) => {
  if (!file) return resolve("");
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== "string") {
      reject(new Error("The selected image could not be read."));
      return;
    }

    const image = new Image();
    image.onload = () => {
      try {
        if (!image.naturalWidth || !image.naturalHeight) {
          reject(new Error("The selected image has invalid dimensions."));
          return;
        }

        const initialScale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
        let scale = initialScale;
        let quality = 0.8;

        for (let attempt = 0; attempt < 20; attempt += 1) {
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Image compression is unavailable in this browser."));
            return;
          }

          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const compressedImage = canvas.toDataURL("image/jpeg", quality);
          if (compressedImage !== "data:," && compressedImage.length <= 280 * 1024) {
            resolve(compressedImage);
            return;
          }

          if (quality > 0.5) quality = Math.max(0.5, quality - 0.1);
          else {
            scale *= 0.8;
            quality = 0.8;
          }
        }
        reject(new Error("The image could not be compressed below 280 KB."));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("The selected image could not be decoded."));
    image.src = reader.result;
  };
  reader.onerror = (error) => reject(error);
  reader.readAsDataURL(file);
});

export function DataProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [news, setNews] = useState([]);
  const [comments, setComments] = useState([]);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [admins, setAdmins] = useState(() => readStorage("yoda-admins", adminsSeed));
  const [settings, setSettings] = useState({});
  const [adMobSettings, setAdMobSettings] = useState(defaultAdMobSettings);
  const [settingsSyncError, setSettingsSyncError] = useState("");
  const [adMobSettingsSyncError, setAdMobSettingsSyncError] = useState("");
  const [dataSyncError, setDataSyncError] = useState("");
  const [apps, setApps] = useState(() => readStorage("yoda-apps", appsSeed));
  const [isLoading, setIsLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const activeRequests = useRef(0);
  const loadedCoreCollections = useRef(new Set());

  const withLoading = useCallback(async (operation) => {
    activeRequests.current += 1;
    setIsLoading(true);
    try {
      return await operation();
    } finally {
      activeRequests.current -= 1;
      setIsLoading(activeRequests.current > 0);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("yoda-admins", JSON.stringify(admins));
  }, [admins]);
  useEffect(() => {
    localStorage.setItem("yoda-apps", JSON.stringify(apps));
  }, [apps]);

  useEffect(() => {
    const onDataError = (label) => (error) => {
      setDataSyncError(`${label} could not be loaded: ${error.message}`);
    };
    const unsubscribers = [
      onSnapshot(collection(db, "categories"), (snapshot) => {
        setCategories(snapshot.docs.map(mapCategory));
        loadedCoreCollections.current.add("categories");
        if (loadedCoreCollections.current.has("news")) setDataReady(true);
        setDataSyncError("");
      }, onDataError("Categories")),
      onSnapshot(query(collection(db, "news"), orderBy("date", "desc")), (snapshot) => {
        setNews(snapshot.docs.map(mapNews));
        loadedCoreCollections.current.add("news");
        if (loadedCoreCollections.current.has("categories")) setDataReady(true);
        setDataSyncError("");
      }, onDataError("News")),
      onSnapshot(collection(db, "comments"), (snapshot) => {
        setComments(snapshot.docs.map(mapComment));
        setDataSyncError("");
      }, onDataError("Comments")),
      onSnapshot(collection(db, "reports"), (snapshot) => {
        setReports(snapshot.docs.map(mapReport));
        setDataSyncError("");
      }, onDataError("Reports")),
      onSnapshot(collection(db, "users"), (snapshot) => {
        setUsers(snapshot.docs.map(mapUser));
        setDataSyncError("");
      }, onDataError("Users")),
      onSnapshot(collection(db, "notifications"), (snapshot) => {
        setNotifications(snapshot.docs.map(mapNotification));
        setDataSyncError("");
      }, onDataError("Notifications")),
      onSnapshot(doc(db, "app_settings", "global_config"), (snapshot) => {
        setSettings(snapshot.exists() ? snapshot.data() : {});
        setSettingsSyncError("");
      }, (error) => setSettingsSyncError(`Settings could not be loaded: ${error.message}`)),
      onSnapshot(doc(db, "settings", "ads"), (snapshot) => {
        setAdMobSettings({ ...defaultAdMobSettings, ...(snapshot.exists() ? snapshot.data() : {}) });
        setAdMobSettingsSyncError("");
      }, (error) => setAdMobSettingsSyncError(`AdMob settings could not be loaded: ${error.message}`)),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const value = useMemo(() => ({
    categories,
    news,
    comments,
    reports,
    users,
    notifications,
    admins,
    settings,
    adMobSettings,
    adMobSettingsSyncError,
    settingsSyncError,
    dataSyncError,
    apps,
    isLoading,
    dataReady,
    async addCategory(categoryData, imageFile) {
      return withLoading(async () => {
        const iconUrl = imageFile
          ? await convertToBase64(imageFile, 600, 600)
          : categoryData.iconUrl || categoryData.image || "";
        const payload = { name: categoryData.name, iconUrl };
        const result = await addDoc(collection(db, "categories"), { ...payload, createdAt: serverTimestamp() });
        return result.id;
      });
    },
    async updateCategory(categoryId, categoryData, imageFile) {
      return withLoading(async () => {
        const iconUrl = imageFile
          ? await convertToBase64(imageFile, 600, 600)
          : categoryData.iconUrl || categoryData.image || "";
        await setDoc(doc(db, "categories", categoryId), { name: categoryData.name, iconUrl }, { merge: true });
        return categoryId;
      });
    },
    async deleteCategory(categoryId) {
      return withLoading(() => deleteDoc(doc(db, "categories", categoryId)));
    },
    async addNews(newsData, primaryImageFile, optionalImageFile) {
      return withLoading(async () => {
        const [primaryImageUrl, optionalImageUrl] = await Promise.all([
          primaryImageFile
            ? convertToBase64(primaryImageFile, 1000)
            : Promise.resolve(newsData.primaryImageUrl || newsData.image || ""),
          optionalImageFile
            ? convertToBase64(optionalImageFile, 1000)
            : Promise.resolve(newsData.optionalImageUrl || newsData.secondaryImage || ""),
        ]);
        const category = categories.find((item) => item.name === (newsData.categoryName || newsData.category));
        const payload = {
          title: newsData.title,
          date: newsData.date || new Date().toISOString(),
          categoryId: newsData.categoryId || category?.id || "",
          categoryName: newsData.categoryName || newsData.category || category?.name || "",
          contentType: newsData.contentType || newsData.type || "NEWS",
          primaryImageUrl,
          optionalImageUrl,
          description: newsData.description ?? newsData.content ?? "",
          views: Number(newsData.views || 0),
          commentsCount: Number(newsData.commentsCount ?? newsData.comments ?? 0),
          createdAt: serverTimestamp(),
        };
        const result = await addDoc(collection(db, "news"), payload);
        return result.id;
      });
    },
    async updateNews(newsId, newsData, newPrimaryImageFile, newOptionalImageFile) {
      return withLoading(async () => {
        const category = categories.find((item) => item.name === (newsData.categoryName || newsData.category));
        const [primaryImageUrl, optionalImageUrl] = await Promise.all([
          newPrimaryImageFile
            ? convertToBase64(newPrimaryImageFile, 1000)
            : Promise.resolve(newsData.primaryImageUrl || newsData.image || ""),
          newOptionalImageFile
            ? convertToBase64(newOptionalImageFile, 1000)
            : Promise.resolve(newsData.optionalImageUrl || newsData.secondaryImage || ""),
        ]);
        const payload = {
          title: newsData.title,
          date: newsData.date || new Date().toISOString(),
          categoryId: newsData.categoryId || category?.id || "",
          categoryName: newsData.categoryName || newsData.category || category?.name || "",
          contentType: newsData.contentType || newsData.type || "NEWS",
          primaryImageUrl,
          optionalImageUrl,
          description: newsData.description ?? newsData.content ?? "",
          updatedAt: serverTimestamp(),
        };
        await updateDoc(doc(db, "news", newsId), payload);
      });
    },
    async deleteNews(newsIds) {
      return withLoading(async () => {
        const ids = Array.isArray(newsIds) ? newsIds : [newsIds];
        await Promise.all(ids.map((id) => deleteDoc(doc(db, "news", id))));
      });
    },
    async deleteComment(commentId, newsId) {
      return withLoading(() => runTransaction(db, async (transaction) => {
        const commentRef = doc(db, "comments", commentId);
        const commentSnapshot = await transaction.get(commentRef);
        if (!commentSnapshot.exists()) return;
        const targetNewsId = newsId || commentSnapshot.data().newsId;
        const newsRef = targetNewsId ? doc(db, "news", targetNewsId) : null;
        const newsSnapshot = newsRef ? await transaction.get(newsRef) : null;
        transaction.delete(commentRef);
        if (newsSnapshot?.exists()) {
          const count = Number(newsSnapshot.data().commentsCount ?? newsSnapshot.data().comments ?? 0);
          transaction.update(newsRef, { commentsCount: Math.max(0, count - 1) });
        }
      }));
    },
    async deleteReport(reportId) {
      return withLoading(() => deleteDoc(doc(db, "reports", reportId)));
    },
    async saveUser(user) {
      return withLoading(() => setDoc(doc(db, "users", user.id), {
        name: user.name,
        email: user.email,
        status: user.status || "ENABLED",
      }, { merge: true }));
    },
    async deleteUserData(userId) {
      return withLoading(async () => {
        const userComments = await getDocs(query(collection(db, "comments"), where("userId", "==", userId)));
        const userReports = await getDocs(query(collection(db, "reports"), where("userId", "==", userId)));
        const reportedReports = await getDocs(query(collection(db, "reports"), where("reportedUserId", "==", userId)));
        const reportRefs = new Map([...userReports.docs, ...reportedReports.docs].map((item) => [item.id, item.ref]));
        const commentCounts = new Map();
        userComments.docs.forEach((item) => {
          const targetNewsId = item.data().newsId;
          if (targetNewsId) commentCounts.set(targetNewsId, (commentCounts.get(targetNewsId) || 0) + 1);
        });
        const batch = writeBatch(db);
        batch.delete(doc(db, "users", userId));
        userComments.docs.forEach((item) => batch.delete(item.ref));
        reportRefs.forEach((reportRef) => batch.delete(reportRef));
        commentCounts.forEach((count, targetNewsId) => {
          if (news.some((item) => item.id === targetNewsId)) {
            batch.update(doc(db, "news", targetNewsId), { commentsCount: increment(-count) });
          }
        });
        await batch.commit();
      });
    },
    async saveNotification(notification) {
      return withLoading(async () => {
        const data = {
          title: notification.title,
          message: notification.message,
          image: notification.image || "",
          link: notification.link || "",
          status: notification.status || "SAVED",
        };
        if (notification.id) {
          await setDoc(doc(db, "notifications", notification.id), data, { merge: true });
          return { ...notification, ...data };
        }
        const result = await addDoc(collection(db, "notifications"), {
          ...data,
          createdAt: serverTimestamp(),
        });
        return { ...notification, ...data, id: result.id };
      });
    },
    async dispatchNotification(notification) {
      const appId = settings.oneSignalAppId;
      const restApiKey = settings.oneSignalRestApiKey;
      if (!appId || !restApiKey) {
        await updateDoc(doc(db, "notifications", notification.id), { status: "SAVED" });
        return { status: "SAVED" };
      }
      let response;
      try {
        response = await fetch("https://onesignal.com/api/v1/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${restApiKey}`,
          },
          body: JSON.stringify({
            app_id: appId,
            included_segments: ["All"],
            headings: { en: notification.title },
            contents: { en: notification.message },
            ...(notification.link && { url: notification.link }),
            ...(notification.image?.startsWith("https://") && { big_picture: notification.image }),
          }),
        });
      } catch (error) {
        await updateDoc(doc(db, "notifications", notification.id), { status: "FAILED" });
        throw new Error(`Notification saved, but OneSignal could not be reached: ${error.message}`);
      }
      if (!response.ok) {
        const responseDetails = await response.text();
        await updateDoc(doc(db, "notifications", notification.id), { status: "FAILED" });
        throw new Error(`Notification saved, but OneSignal rejected the request (HTTP ${response.status}): ${responseDetails}`);
      }
      await updateDoc(doc(db, "notifications", notification.id), { status: "SENT", sentAt: serverTimestamp() });
      return { status: "SENT" };
    },
    async deleteNotification(notificationId) {
      return withLoading(() => deleteDoc(doc(db, "notifications", notificationId)));
    },
    saveAdmin(admin) {
      const profile = { id: admin.id || crypto.randomUUID(), username: admin.username, fullName: admin.fullName, email: admin.email };
      setAdmins((current) => admin.id
        ? current.map((item) => item.id === admin.id ? profile : item)
        : [...current, profile]);
    },
    async updateSettings(settingsData) {
      return withLoading(async () => {
        await setDoc(doc(db, "app_settings", "global_config"), settingsData, { merge: true });
      });
    },
    async updateAdMobSettings(settingsData) {
      return withLoading(async () => {
        await setDoc(doc(db, "settings", "ads"), settingsData, { merge: true });
      });
    },
    saveApp(app) {
      setApps((current) => {
        if (app.id) return current.map((item) => item.id === app.id ? { ...item, ...app } : item);
        return [{
          ...app,
          id: crypto.randomUUID(),
          serverKey: "DEMO_ONLY_SERVER_KEY_NOT_FOR_PRODUCTION",
          restApiKey: "DEMO_ONLY_REST_API_KEY_NOT_FOR_PRODUCTION",
        }, ...current];
      });
    },
    deleteApp(id) {
      setApps((current) => current.filter((app) => app.id !== id));
    },
  }), [
    admins, apps, categories, comments, dataSyncError, isLoading, news, notifications,
    reports, settings, adMobSettings, adMobSettingsSyncError, settingsSyncError, users, withLoading, dataReady,
  ]);

  return (
    <DataContext.Provider value={value}>
      {dataSyncError && <div className="inline-feedback inline-feedback-error" role="alert">{dataSyncError}</div>}
      {settingsSyncError && <div className="inline-feedback inline-feedback-error" role="alert">{settingsSyncError}</div>}
      {adMobSettingsSyncError && <div className="inline-feedback inline-feedback-error" role="alert">{adMobSettingsSyncError}</div>}
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}
