import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, constants } from '../global';

const MultiSelectModalField = ({
  label,
  items,
  selectedValues,
  onChange,
  emptyText,
  confirmLabel,
  getId = (item) => String(item._id || item.id),
  getLabel = (item) => item.name,
}) => {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = selectedValues || [];
  const selectedLabels = items
    .filter((item) => selected.includes(getId(item)))
    .map((item) => getLabel(item));
  const bottomSpace = Math.max(insets.bottom + constants.SPACING.xl, 80);

  const toggleValue = (value) => {
    const nextValues = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];

    onChange(nextValues);
  };

  if (!items.length) {
    return <Text style={styles.hint}>{emptyText}</Text>;
  }

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setVisible(true)}
      >
        <Text style={selectedLabels.length ? styles.buttonText : styles.placeholderText}>
          {selectedLabels.length ? selectedLabels.join(', ') : '-'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.content, { paddingBottom: bottomSpace }]}>
                <Text style={styles.title}>{label}</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.list}>
                    {items.map((item) => {
                      const id = getId(item);
                      const isSelected = selected.includes(id);

                      return (
                        <TouchableOpacity
                          key={id}
                          style={[
                            styles.chip,
                            isSelected && styles.chipSelected
                          ]}
                          onPress={() => toggleValue(id)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextSelected
                            ]}
                          >
                            {getLabel(item)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => setVisible(false)}
                >
                  <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: colors.grey[300],
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    backgroundColor: colors.white,
  },
  buttonText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  hint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: constants.SPACING.xs,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  content: {
    maxHeight: '75%',
    backgroundColor: colors.white,
    borderTopLeftRadius: constants.BORDER_RADIUS * 2,
    borderTopRightRadius: constants.BORDER_RADIUS * 2,
    padding: constants.SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: constants.SPACING.md,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: constants.SPACING.sm,
  },
  chip: {
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.xs,
    borderRadius: constants.BORDER_RADIUS,
    backgroundColor: colors.grey[100],
    borderWidth: 1,
    borderColor: colors.grey[200],
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  chipTextSelected: {
    color: colors.white,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: constants.BORDER_RADIUS,
    paddingVertical: constants.SPACING.md,
    marginTop: constants.SPACING.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MultiSelectModalField;
