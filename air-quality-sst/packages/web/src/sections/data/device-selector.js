import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';

export const DeviceSelector = (props) => {
  const {items, onChange} = props;
  const [item, setItem] = useState('')

  const handleChange = (event) => {
    setItem(event.target.value);
    onChange(event.target.value);
  }

  return (
    <FormControl fullWidth>
      <Select
        value={item}
        onChange={handleChange}
        displayEmpty
      >
        <MenuItem 
          value=""
          disabled={item !== ''}>
            <em>Select Device</em>
        </MenuItem>
        {...items.map((item) => (
            <MenuItem
              key={item}
              value={item}>
              {item}
            </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

DeviceSelector.protoTypes = {
  items: PropTypes.array.isRequired,
  onChange: PropTypes.array.isRequired
};
  