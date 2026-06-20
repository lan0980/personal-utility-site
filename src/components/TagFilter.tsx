import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { Tag } from '../types';

interface TagFilterProps {
  tags: Tag[];
  selectedTagIds: string[];
  onSelectionChange: (tagIds: string[]) => void;
}

/**
 * 标签筛选组件：支持多选标签进行筛选
 */
const TagFilter: React.FC<TagFilterProps> = ({
  tags,
  selectedTagIds,
  onSelectionChange,
}) => {
  const handleToggle = (tagId: string) => {
    const newSelection = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    onSelectionChange(newSelection);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  if (tags.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <LocalOfferIcon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          按标签筛选
        </Typography>
        {selectedTagIds.length > 0 && (
          <Chip
            label="清除"
            size="small"
            variant="outlined"
            onClick={handleClearAll}
            sx={{ ml: 'auto', height: 24, fontSize: '0.75rem' }}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <Chip
              key={tag.id}
              label={tag.name}
              size="small"
              onClick={() => handleToggle(tag.id)}
              variant={isSelected ? 'filled' : 'outlined'}
              sx={{
                borderColor: tag.color,
                bgcolor: isSelected ? tag.color : 'transparent',
                color: isSelected ? '#fff' : tag.color,
                fontWeight: isSelected ? 600 : 400,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isSelected ? tag.color : `${tag.color}18`,
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default TagFilter;
