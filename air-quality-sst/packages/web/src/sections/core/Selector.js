import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';

export const Selector = (props) => {
  const { items, onChange, defaultText, defaultItem } = props;
  const [item, setItem] = useState(defaultItem ?? '');

  const handleChange = (event) => {
    setItem(event.target.value);
    onChange(event.target.value);
  };

  return (
    <FormControl fullWidth>
      <Select value={item} onChange={handleChange} displayEmpty>
        {!defaultItem && (
          <MenuItem value="" disabled={item !== ''}>
            <em>{defaultText ?? 'Select'}</em>
          </MenuItem>
        )}
        {...items.map((item) => (
          <MenuItem key={item} value={item}>
            {item}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

Selector.protoTypes = {
  defaultText: PropTypes.string,
  items: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  defaultItem: PropTypes.any,
};
