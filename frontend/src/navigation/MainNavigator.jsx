// navigation/MainNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useWindowDimensions } from 'react-native';

// Screens
import Home from '../screens/Home';
import SearchScreen from '../screens/SearchScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import InstitutionProfileScreen from '../screens/InstitutionProfileScreen';
import InstitutionListScreen from '../screens/InstitutionListScreen';
import ProfileScreen from '../screens/ProfileScreen.jsx';
import PublicDonorProfileScreen from '../screens/PublicDonorProfileScreen'; 
import PostNeedScreen from '../screens/PostNeedScreen';
import PostDonationScreen from '../screens/PostDonationScreen';
import ReviewDonationScreen from '../screens/ReviewDonationScreen';
import EditProfileScreen from '../screens/EditProfileScreen.jsx';

// Components
import TabBar from '../components/TabBar';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator para Chat
const ChatStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ChatList" component={ChatListScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
  </Stack.Navigator>
);

// Stack Navigator principal para cada tab
const HomeStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeTab" component={Home} />
    <Stack.Screen name="InstitutionProfile" component={InstitutionProfileScreen} />
    <Stack.Screen name="InstitutionList" component={InstitutionListScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="ReviewDonation" component={ReviewDonationScreen} />
    <Stack.Screen name="PublicDonorProfile" component={PublicDonorProfileScreen} />
    <Stack.Screen name="PostNeed" component={PostNeedScreen} />
    <Stack.Screen name="PostDonation" component={PostDonationScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
  </Stack.Navigator>
);

const SearchStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SearchTab" component={SearchScreen} />
    <Stack.Screen name="InstitutionProfile" component={InstitutionProfileScreen} />
    <Stack.Screen name="PublicDonorProfile" component={PublicDonorProfileScreen} />
  </Stack.Navigator>
);

const NotificationsStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="NotificationsTab" component={NotificationsScreen} />
    <Stack.Screen name="InstitutionProfile" component={InstitutionProfileScreen} />
    <Stack.Screen name="PublicDonorProfile" component={PublicDonorProfileScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
  </Stack.Navigator>
);

const ProfileStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileTab" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="PublicDonorProfile" component={PublicDonorProfileScreen} />
  </Stack.Navigator>
);

const MainNavigator = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      sceneContainerStyle={{
        backgroundColor: 'transparent',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: '🏠',
        }}
      />
      
      <Tab.Screen 
        name="Search" 
        component={SearchStackNavigator}
        options={{
          tabBarLabel: 'Buscar',
          tabBarIcon: '🔍',
        }}
      />
      
      <Tab.Screen 
        name="Messages" 
        component={ChatStackNavigator}
        options={{
          tabBarLabel: 'Mensagens',
          tabBarIcon: '💬',
        }}
      />
      
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsStackNavigator}
        options={{
          tabBarLabel: 'Notificações',
          tabBarIcon: '🔔',
        }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: '👤',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;