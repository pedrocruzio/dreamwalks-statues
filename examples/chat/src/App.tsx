import './App.css';

import {
  AdditionalPhonemeInfo,
  Character,
  EmotionEvent,
  HistoryItem,
  InworldConnectionService,
  InworldPacket,
} from '@inworld/web-sdk';
// import { ArrowBackRounded } from '@mui/icons-material';
import { Button } from '@mui/material';
// import { Grid } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useHistory, useParams } from 'react-router-dom';

import { Chat } from './app/chat/Chat';
import { PlayerNameInput } from './app/chat/Chat.styled';
import { Avatar } from './app/components/3dAvatar/Avatar';
// import { CircularRpmAvatar } from './app/components/CircularRpmAvatar';
import { Layout } from './app/components/Layout';
import {
  ChatWrapper,
  MainWrapper,
  // SimulatorHeader,
} from './app/components/Simulator';
import { InworldService } from './app/connection';
import { save as saveConfiguration } from './app/helpers/configuration';
import { CHAT_VIEW, Configuration, EmotionsMap } from './app/types';
import { config } from './config';
import * as defaults from './defaults';

interface CurrentContext {
  characters: Character[];
  chatting: boolean;
  connection?: InworldConnectionService;
}

interface RouteParams {
  character_name: string;
}

function App() {
  const formMethods = useForm<Configuration>({ mode: 'onChange' });
  const [playerName, setPlayerName] = useState<string | null>(null);

  const [connection, setConnection] = useState<InworldConnectionService>();
  const [character, setCharacter] = useState<Character>();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [chatHistory, setChatHistory] = useState<HistoryItem[]>([]);
  const [chatting, setChatting] = useState(false);
  const [chatView, setChatView] = useState(CHAT_VIEW.TEXT);
  const [phonemes, setPhonemes] = useState<AdditionalPhonemeInfo[]>([]);
  const [emotionEvent, setEmotionEvent] = useState<EmotionEvent>();
  // const [avatar, setAvatar] = useState('');
  const [emotions, setEmotions] = useState<EmotionsMap>({});

  const stateRef = useRef<CurrentContext>();
  stateRef.current = {
    characters,
    chatting,
    connection,
  };

  const onHistoryChange = useCallback((history: HistoryItem[]) => {
    setChatHistory(history);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openConnection = useCallback(async () => {
    if (playerName === null) {
      console.log('Player name not set. Not opening connection.');
      return;
    }
    console.log('openConnection function called');
    const form = formMethods.getValues();
    console.log(form);

    setChatting(true);
    setChatView(form.chatView!);

    const service = new InworldService({
      onHistoryChange,
      capabilities: {
        ...(form.chatView === CHAT_VIEW.AVATAR && { phonemes: true }),
        emotions: true,
        narratedActions: true,
      },
      sceneName: form.scene?.name!,
      playerName: playerName,
      onPhoneme: (phonemes: AdditionalPhonemeInfo[]) => {
        setPhonemes(phonemes);
      },
      onReady: async () => {
        console.log('Ready!');
      },
      onDisconnect: () => {
        console.log('Disconnect!');
      },
      onMessage: (inworldPacket: InworldPacket) => {
        if (
          inworldPacket.isEmotion() &&
          inworldPacket.packetId?.interactionId
        ) {
          setEmotionEvent(inworldPacket.emotions);
          setEmotions((currentState) => ({
            ...currentState,
            [inworldPacket.packetId.interactionId]: inworldPacket.emotions,
          }));
        }
      },
    });
    const characters = await service.connection.getCharacters();
    const character = characters.find(
      (c: Character) => c.resourceName === form.character?.name,
    );

    if (character) {
      service.connection.setCurrentCharacter(character);

      // const assets = character?.assets;
      // const rpmImageUri = assets?.rpmImageUriPortrait;
      // const avatarImg = assets?.avatarImg;
      // setAvatar(avatarImg || rpmImageUri || '');
    }

    setConnection(service.connection);

    setCharacter(character);
    setCharacters(characters);
  }, [formMethods, onHistoryChange, playerName]);

  const history = useHistory();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const stopChatting = useCallback(async () => {
    console.log('Attempting to stop chatting...');

    // Disable flags
    setChatting(false);

    // Stop audio playing and capturing
    connection?.player?.stop();
    connection?.player?.clear();
    connection?.recorder?.stop();

    // Clear collections
    setChatHistory([]);

    // Close connection and clear connection data
    connection?.close();
    setConnection(undefined);
    setCharacter(undefined);
    setCharacters([]);

    // Navigate back to home
    history.push('/');
  }, [connection, history]); // note the addition of history to the dependency array

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resetForm = useCallback(() => {
    formMethods.reset({
      ...defaults.configuration,
    });
    saveConfiguration(formMethods.getValues());
  }, [formMethods]);

  const handlePlayerNameSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const playerNameInput = e.currentTarget.elements.namedItem(
      'playerName',
    ) as HTMLInputElement;
    setPlayerName(playerNameInput.value);
  };

  useEffect(() => {
    if (playerName) {
      openConnection();
    }
  }, [playerName, openConnection]);

  const { character_name } = useParams<RouteParams>();

  useEffect(() => {
    if (history && history.location && character_name) {
      formMethods.setValue(
        'scene.name',
        `workspaces/default-_wue38lymyd9iehiz6gbng/scenes/${character_name}_statue`,
      );
      formMethods.setValue(
        'character.name',
        `workspaces/default-_wue38lymyd9iehiz6gbng/characters/${character_name}`,
      );
    }
  }, [history, formMethods, character_name]); // note the removal of openConnection from the dependency array

  const content = (
    <>
      {playerName ? (
        character ? (
          <MainWrapper>
            <ChatWrapper>
              <Avatar
                emotionEvent={emotionEvent}
                phonemes={phonemes}
                visible={chatView === CHAT_VIEW.AVATAR}
                url={
                  config.RPM_AVATAR ||
                  character.assets.rpmModelUri ||
                  defaults.DEFAULT_RPM_AVATAR
                }
              />
              <Chat
                chatView={chatView}
                chatHistory={chatHistory}
                connection={connection!}
                emotions={emotions}
              />
            </ChatWrapper>
          </MainWrapper>
        ) : (
          'Loading...'
        )
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh', // this makes sure the container covers the whole viewport height
          }}
        >
          <form onSubmit={handlePlayerNameSubmit}>
            <label style={{ color: 'white' }}>
              Enter your name:
              <PlayerNameInput type="text" name="playerName" required />
            </label>
            <Button type="submit" variant="contained">
              Submit
            </Button>
          </form>
        </div>
      )}
    </>
  );

  return (
    <FormProvider {...formMethods}>
      <Layout>{content}</Layout>
    </FormProvider>
  );
}

export default App;
