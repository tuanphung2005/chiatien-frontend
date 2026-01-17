import { Redirect } from 'expo-router';

// This screen just redirects to camera screen with gallery mode
export default function GalleryExpenseScreen() {
    return <Redirect href="/expense/camera" />;
}
