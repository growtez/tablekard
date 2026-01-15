import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    Linking,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { spacing, shadows } from '../theme';

const { width } = Dimensions.get('window');

const AboutScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const colors = theme.colors;
    const [activeHourIndex, setActiveHourIndex] = useState(0);
    const scrollerRef = useRef(null);

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const cardWidth = 220;
        const index = Math.round(scrollPosition / cardWidth);
        setActiveHourIndex(Math.min(index, 2));
    };

    const scrollToCard = (index) => {
        if (scrollerRef.current) {
            scrollerRef.current.scrollTo({
                x: index * 220,
                animated: true,
            });
            setActiveHourIndex(index);
        }
    };

    // Stats data
    const highlights = [
        { label: 'Years of Legacy', value: '12+' },
        { label: 'Happy Customers', value: '50k' },
        { label: 'Fresh Ingredients', value: 'Pure' },
    ];

    // Operating hours
    const operatingHours = [
        { day: 'MON — FRI', time: '11:00 AM — 10:00 PM', active: true },
        { day: 'SATURDAY', time: '10:00 AM — 11:30 PM', active: false },
        { day: 'SUNDAY', time: '10:00 AM — 09:00 PM', active: false },
    ];

    const handleCall = () => Linking.openURL('tel:+911234567890');
    const handleEmail = () => Linking.openURL('mailto:delishbngaigaonhere@gmail.com');
    const handleWhatsApp = () => Linking.openURL('https://wa.me/911234567890');
    const handleDirections = () => Linking.openURL('https://maps.google.com/?q=BOC+Gate+Chapaguri+Rd+Bongaigaon+Assam+783380');
    const handleInstagram = () => Linking.openURL('https://instagram.com/delish_bongaigaon');
    const handleFacebook = () => Linking.openURL('https://facebook.com/delishbongaigaon');

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: colors.primaryLight }]}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={20} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <Text style={[styles.headerLabel, { color: colors.primary }]}>OUR STORY</Text>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>About Us</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Brand Section */}
                <View style={styles.brandSection}>
                    <View style={[styles.brandBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}>
                        <Icon name="coffee" size={24} color={colors.primary} />
                    </View>
                    <Text style={[styles.brandName, { color: colors.text }]}>DELISH</Text>
                    <Text style={[styles.brandTagline, { color: colors.textMuted }]}>
                        Crafting culinary memories since 2012
                    </Text>
                </View>

                {/* Manifesto Card */}
                <View style={[styles.manifestoCard, { backgroundColor: colors.card }, shadows.md]}>
                    <View style={[styles.manifestoIcon, { backgroundColor: colors.primaryLight }]}>
                        <Icon name="feather" size={24} color={colors.primary} />
                    </View>
                    <Text style={[styles.manifestoTitle, { color: colors.text }]}>Our Manifesto</Text>
                    <Text style={[styles.manifestoText, { color: colors.textSecondary }]}>
                        At DELISH, we believe that every meal is an opportunity to create memories.
                        Our chefs pour their hearts into every dish, using only the freshest ingredients
                        sourced from local farms. We're not just a restaurant — we're a celebration of
                        flavors, traditions, and the joy of sharing food with loved ones.
                    </Text>
                </View>

                {/* Highlights Row */}
                <View style={styles.highlightsRow}>
                    {highlights.map((item, index) => (
                        <View
                            key={item.label}
                            style={[styles.highlightCard, { backgroundColor: colors.card }, shadows.sm]}
                        >
                            <Text style={[styles.highlightValue, { color: colors.primary }]}>{item.value}</Text>
                            <Text style={[styles.highlightLabel, { color: colors.textMuted }]}>{item.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Operating Hours */}
                <View style={styles.section}>
                    <View style={styles.sectionLabelRow}>
                        <Icon name="clock" size={16} color={colors.primary} />
                        <Text style={[styles.sectionLabel, { color: colors.text }]}>OPERATING HOURS</Text>
                    </View>

                    <ScrollView
                        ref={scrollerRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        contentContainerStyle={styles.hoursScroller}
                    >
                        {operatingHours.map((item, index) => (
                            <View
                                key={item.day}
                                style={[
                                    styles.hourPill,
                                    {
                                        backgroundColor: activeHourIndex === index ? colors.primaryLight : colors.card,
                                        borderColor: activeHourIndex === index ? colors.primary : colors.border,
                                    }
                                ]}
                            >
                                {item.active && (
                                    <View style={[styles.openNowBadge, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.openNowText}>Open Now</Text>
                                    </View>
                                )}
                                <Text style={[styles.hourDay, { color: colors.text }]}>{item.day}</Text>
                                <Text style={[styles.hourTime, { color: colors.textMuted }]}>{item.time}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Pagination Dots */}
                    <View style={styles.paginationDots}>
                        {operatingHours.map((_, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => scrollToCard(index)}
                            >
                                <View
                                    style={[
                                        styles.pagDot,
                                        { backgroundColor: activeHourIndex === index ? colors.primary : colors.border },
                                        activeHourIndex === index && styles.pagDotActive
                                    ]}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Visit Us Section */}
                <View style={styles.section}>
                    <View style={styles.sectionLabelRow}>
                        <Icon name="map-pin" size={16} color={colors.primary} />
                        <Text style={[styles.sectionLabel, { color: colors.text }]}>VISIT US</Text>
                    </View>

                    {/* Location Card */}
                    <View style={[styles.locationCard, { backgroundColor: colors.card }, shadows.md]}>
                        <View style={[styles.mapPlaceholder, { backgroundColor: colors.primaryLight }]}>
                            <Icon name="map-pin" size={32} color={colors.primary} />
                            <Text style={[styles.mapLabel, { color: colors.primary }]}>BONGAIGAON</Text>
                        </View>
                        <View style={styles.locationDetails}>
                            <Text style={[styles.locationName, { color: colors.text }]}>DELISH Restaurant</Text>
                            <Text style={[styles.locationAddress, { color: colors.textMuted }]}>
                                BOC Gate, Chapaguri Rd, Bongaigaon, Assam 783380
                            </Text>
                            <TouchableOpacity
                                style={[styles.directionsBtn, { backgroundColor: colors.primary }]}
                                onPress={handleDirections}
                            >
                                <Icon name="map-pin" size={14} color="#FFFFFF" />
                                <Text style={styles.directionsBtnText}>Get Directions</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Contact Icons */}
                    <View style={[styles.contactIconsRow, { backgroundColor: colors.card }, shadows.sm]}>
                        <TouchableOpacity style={styles.contactIconItem} onPress={handleCall}>
                            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}>
                                <Icon name="phone" size={22} color={colors.primary} />
                            </View>
                            <Text style={[styles.iconLabel, { color: colors.primary }]}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contactIconItem} onPress={handleEmail}>
                            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}>
                                <Icon name="mail" size={22} color={colors.primary} />
                            </View>
                            <Text style={[styles.iconLabel, { color: colors.primary }]}>Email</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contactIconItem} onPress={handleWhatsApp}>
                            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}>
                                <Icon name="message-circle" size={22} color={colors.primary} />
                            </View>
                            <Text style={[styles.iconLabel, { color: colors.primary }]}>WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Social Footer */}
                <View style={styles.socialFooter}>
                    <View style={styles.socialRow}>
                        <TouchableOpacity
                            style={[styles.socialBtn, { backgroundColor: colors.primaryLight }]}
                            onPress={handleInstagram}
                        >
                            <Icon name="instagram" size={22} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.socialBtn, { backgroundColor: colors.primaryLight }]}
                            onPress={handleFacebook}
                        >
                            <Icon name="facebook" size={22} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.socialBtn, { backgroundColor: colors.primaryLight }]}
                            onPress={handleDirections}
                        >
                            <Icon name="globe" size={22} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.footerSignature}>
                        <View style={[styles.sigLine, { backgroundColor: colors.textMuted }]} />
                        <Text style={[styles.copyright, { color: colors.textMuted }]}>© 2026 DELISH RESTAURANT</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleWrap: { alignItems: 'center' },
    headerLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },

    scrollContent: {
        padding: 20,
    },

    // Brand Section
    brandSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    brandBadge: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        marginBottom: 16,
    },
    brandName: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: 6,
    },
    brandTagline: {
        fontSize: 14,
        textAlign: 'center',
    },

    // Manifesto
    manifestoCard: {
        borderRadius: 24,
        padding: 28,
        marginBottom: 24,
        alignItems: 'center',
    },
    manifestoIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    manifestoTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    manifestoText: {
        fontSize: 14,
        lineHeight: 24,
        textAlign: 'center',
    },

    // Highlights
    highlightsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 32,
    },
    highlightCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    highlightValue: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    highlightLabel: {
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
    },

    // Section
    section: {
        marginBottom: 28,
    },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },

    // Hours Scroller
    hoursScroller: {
        gap: 12,
        paddingVertical: 15,
    },
    hourPill: {
        width: 200,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1.5,
        position: 'relative',
    },
    openNowBadge: {
        position: 'absolute',
        top: -10,
        right: -5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    openNowText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    hourDay: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 6,
    },
    hourTime: {
        fontSize: 13,
    },

    // Pagination
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
    },
    pagDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    pagDotActive: {
        width: 24,
    },

    // Location Card
    locationCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
    },
    mapPlaceholder: {
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    mapLabel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
    },
    locationDetails: {
        padding: 20,
        alignItems: 'center',
    },
    locationName: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: 1,
    },
    locationAddress: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    directionsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    directionsBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },

    // Contact Icons
    contactIconsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 28,
        paddingVertical: 24,
        borderRadius: 20,
    },
    contactIconItem: {
        alignItems: 'center',
        gap: 10,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    iconLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // Social Footer
    socialFooter: {
        alignItems: 'center',
        paddingTop: 24,
    },
    socialRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    socialBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerSignature: {
        alignItems: 'center',
        opacity: 0.5,
    },
    sigLine: {
        width: 30,
        height: 1,
        marginBottom: 12,
    },
    copyright: {
        fontSize: 9,
        fontWeight: '600',
        letterSpacing: 1,
    },
});

export default AboutScreen;
