import './index.css';

import { ThemeProvider } from '@mui/material';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Route, Switch } from 'react-router-dom';

import App from './App';
import theme from './app/theme';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      <Switch>
        <Route path="/:character_name" component={App} />
      </Switch>
    </BrowserRouter>
  </ThemeProvider>
);
