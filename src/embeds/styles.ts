import { Dimensions, StyleSheet } from 'react-native';

// Get screen dimensions for grid layout
const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 60) / 2; // 2 columns with padding
const cardHeight = cardWidth * 1.77; // 9:16 aspect ratio

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0c',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  title: {
    color: '#e8e8ea',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
    right: 0,
  },
  filterButtonText: {
    color: '#e8e8ea',
    fontSize: 18,
  },
  shareStatus: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareStatusText: {
    color: '#0f0',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  shareStatusSubtext: {
    color: '#0f0',
    fontSize: 12,
    flex: 1,
    marginTop: 4,
  },
  clearButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  clearButtonText: {
    color: '#f00',
    fontSize: 10,
    fontWeight: '600',
  },
  // Grid Layout Styles
  gridContent: {
    paddingBottom: 100, // Add bottom padding to avoid tab bar overlap
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCard: {
    width: cardWidth,
    backgroundColor: '#0f1013',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#202126',
    overflow: 'hidden',
    position: 'relative',
  },
  cardTouchable: {
    flex: 1,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: cardHeight,
    backgroundColor: '#000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    backgroundColor: '#1a1b1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#cfcfd4',
    fontSize: 18,
    fontWeight: '600',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playIcon: {
    color: '#000',
    fontSize: 18,
    marginLeft: 3, // Slight offset to center the triangle
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  newBadge: {
    backgroundColor: 'rgba(0, 255, 0, 0.8)',
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  justAddedBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.8)',
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardInfo: {
    padding: 10,
  },
  cardTitle: {
    color: '#e8e8ea',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#b7b8bd',
    fontSize: 11,
    marginBottom: 4,
  },
  cardPlatform: {
    color: '#9a9ba1',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  noEmbedsText: {
    color: '#9a9ba1',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  loadingText: {
    color: '#e8e8ea',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 44,
    left: 16,
    zIndex: 10,
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 20,
  },
  // Filter Page Styles
  filterContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  filterTitle: {
    color: '#e8e8ea',
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    color: '#e8e8ea',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1013',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#202126',
  },
  filterOptionSelected: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderColor: 'rgba(0, 123, 255, 0.3)',
  },
  filterOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  filterOptionText: {
    color: '#e8e8ea',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  filterOptionTextSelected: {
    color: '#007bff',
    fontWeight: '600',
  },
  filterOptionCheck: {
    color: '#007bff',
    fontSize: 18,
    fontWeight: '600',
  },
});
