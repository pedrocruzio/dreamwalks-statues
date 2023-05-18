import { Box, TextField } from '@mui/material';
import { useCallback, useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { save as saveConfiguration } from '../helpers/configuration';
import { Configuration } from '../types';

const FIELD_NAME = 'player.name';

export const PlayerName = () => {
  const { getValues, formState, register, setValue, watch } =
    useFormContext<Configuration>();

  const playerName = watch(FIELD_NAME);

  useEffect(() => {
    saveConfiguration(getValues());
  }, [playerName]);

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(FIELD_NAME, event.target.value);
    },
    [setValue],
  );

  const errorMessage = useMemo(
    () => formState.errors?.player?.name?.message,
    [formState],
  );

  return (
    <Box sx={{ m: 2 }}>
      <TextField
        fullWidth
        id="player-name"
        size="small"
        label="Player Name"
        placeholder="Enter player name"
        InputLabelProps={{ shrink: true }}
        {...{ error: !!errorMessage, helperText: errorMessage }}
        {...register(FIELD_NAME, {
          onChange,
          required: 'This field is required',
        })}
      />
    </Box>
  );
};
