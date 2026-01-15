import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, StatusBar, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, shadows } from '../theme';

const SettingsScreen = ({ navigation }) => {
    const { theme, themeMode, toggleTheme, isDark } = useTheme();
    const colors = theme.colors;

    const themeOptions = [
        { id: 'dark', label: 'Dark', icon: 'moon', description: 'Dark background with light text' },
        { id: 'light', label: 'Light', icon: 'sun', description: 'Light background with dark text' },
        { id: 'system', label: 'System', icon: 'smartphone', description: 'Follow device settings' },
    ];

    const settingsItems = [
        { id: 1, icon: 'bell', label: 'Notifications', type: 'toggle', value: true },
        { id: 2, icon: 'globe', label: 'Language', type: 'link', value: 'English' },
        { id: 3, icon: 'shield', label: 'Privacy', type: 'link' },
        { id: 4, icon: 'info', label: 'About', type: 'link' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.inputBg }]} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Theme Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
                    <View style={[styles.themeCard, { backgroundColor: colors.card }]}>
                        {themeOptions.map((option, index) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.themeOption,
                                    index !== themeOptions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                                    themeMode === option.id && { backgroundColor: colors.primary + '15' },
                                ]}
                                onPress={() => toggleTheme(option.id)}>
                                <View style={[styles.themeIcon, { backgroundColor: themeMode === option.id ? colors.primary + '30' : colors.inputBg }]}>
                                    <Icon name={option.icon} size={20} color={themeMode === option.id ? colors.primary : colors.textMuted} />
                                </View>
                                <View style={styles.themeInfo}>
                                    <Text style={[styles.themeLabel, { color: colors.text }]}>{option.label}</Text>
                                    <Text style={[styles.themeDesc, { color: colors.textMuted }]}>{option.description}</Text>
                                </View>
                                <View style={[styles.radio, themeMode === option.id && styles.radioSelected, { borderColor: themeMode === option.id ? colors.primary : colors.textMuted }]}>
                                    {themeMode === option.id && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Other Settings */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
                    <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
                        {settingsItems.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.settingItem,
                                    index !== settingsItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                                ]}>
                                <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
                                    <Icon name={item.icon} size={20} color={colors.primary} />
                                </View>
                                <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
                                {item.type === 'toggle' ? (
                                    <Switch
                                        value={item.value}
                                        onValueChange={() => { }}
                                        trackColor={{ false: colors.border, true: colors.primary + '50' }}
                                        thumbColor={item.value ? colors.primary : colors.textMuted}
                                    />
                                ) : (
                                    <View style={styles.settingRight}>
                                        {item.value && <Text style={[styles.settingValue, { color: colors.textMuted }]}>{item.value}</Text>}
                                        <Icon name="chevron-right" size={20} color={colors.textMuted} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={[styles.appName, { color: colors.textMuted }]}>Customer App</Text>
                    <Text style={[styles.appVersion, { color: colors.textMuted }]}>Version 1.0.0</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xl + 20, paddingBottom: spacing.md },
    backBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '600' },

    scrollContent: { padding: spacing.lg },

    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },

    // Theme Card
    themeCard: { borderRadius: 16, overflow: 'hidden' },
    themeOption: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    themeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    themeInfo: { flex: 1 },
    themeLabel: { fontSize: 16, fontWeight: '500', marginBottom: 2 },
    themeDesc: { fontSize: 12 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    radioSelected: {},
    radioInner: { width: 12, height: 12, borderRadius: 6 },

    // Settings Card
    settingsCard: { borderRadius: 16, overflow: 'hidden' },
    settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    settingIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    settingLabel: { flex: 1, fontSize: 16 },
    settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    settingValue: { fontSize: 14 },

    // App Info
    appInfo: { alignItems: 'center', marginTop: 24, paddingBottom: 40 },
    appName: { fontSize: 14, fontWeight: '500' },
    appVersion: { fontSize: 12, marginTop: 4 },
});

export default SettingsScreen;
