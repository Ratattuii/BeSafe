import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../styles/globalStyles';

const TabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // No desktop, não mostra tab bar (pode implementar sidebar depois)
  if (isDesktop) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      {
        paddingBottom: insets.bottom + 8,
      }
    ]}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || route.name;
          const icon = options.tabBarIcon || '📱';

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tab,
                isFocused && styles.tabActive
              ]}
              activeOpacity={0.7}
            >
              <View style={[
                styles.tabContent,
                isFocused && styles.tabContentActive
              ]}>
                <Text style={[
                  styles.tabIcon,
                  isFocused && styles.tabIconActive
                ]}>
                  {icon}
                </Text>
                <Text style={[
                  styles.tabLabel,
                  isFocused && styles.tabLabelActive
                ]}>
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
    paddingTop: 8,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  tabActive: {
    backgroundColor: colors.primaryLight,
  },
  tabContent: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 56,
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default TabBar;



