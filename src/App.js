import { useState } from 'react';
import './App.css';

import COUNTRIES from './constants/countries';

const defaultApiKey = localStorage.getItem('apiKey') || '';

function App() {

  let [apiKey, setApiKey] = useState(defaultApiKey);
  let [apiKeySaved, setApiKeySaved] = useState(!! apiKey);
  let [celebsInput, setCelebsInput] = useState('');
  let [isLoading, setIsLoading] = useState(false);
  let [celebResults, setCelebResults] = useState([]);
  let [celebErrors, setCelebErrors] = useState([]);
  
  function lookup(name) {
    // return new Promise((resolve, reject) => {
    //   setTimeout(() => {
    //     resolve({
    //       "name": "kate mckinnon ",
    //       "net_worth": 9000000,
    //       "gender": "female",
    //       "nationality": "us",
    //       "occupation": [
    //         "comedian",
    //         "actor"
    //       ],
    //       "birthday": "1984-01-06",
    //       "age": 38,
    //       "is_alive": true
    //     });
    //   }, 2000);
    // });
    return fetch(`https://api.api-ninjas.com/v1/celebrity?name=${name}`, {
      headers: {
        'X-Api-Key': apiKey
      }
    })
      .then(response => response.json())
      .then(response => {
        if (response.error) {
          throw new Error(response.error);
        }
        response = response.filter(_ => _.name.toLowerCase() === name.toLowerCase());
        if (response.length === 0) {
          setCelebErrors([...celebErrors, { name, error: 'No results found' }]);
          return null;
        }
        return response[0];
      })
      .catch(error => {
        throw Error(error);
      });
  }

  function saveCelebNames(e) {
    e.preventDefault();

    setCelebResults([]);
    setCelebErrors([]);

    let names = celebsInput.split("\n").filter(name => name.length > 0);
    let promises = names.map(name => lookup(name));
    setIsLoading(true);
    Promise.all(promises)
      .then(results => {
        if (! results) {
          return;
        }
        setCelebResults(results.filter(_ => _));
        setIsLoading(false);
      }).catch(error => {
        alert(error);
        setIsLoading(false);
      });
  }

  function saveApiKey(e) {
    e.preventDefault();

    localStorage.setItem('apiKey', apiKey);
    setApiKeySaved(!! apiKey);
  }

  function formatBirthdate(birthdate) {
    if (! birthdate) {
      return '';
    }
    let date = new Date(birthdate);
    return formatMonth(date.getMonth()) + ' ' + date.getDate() + ', ' + date.getFullYear();
  }
  function formatMonth(month) {
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month];
  }

  function formatNetWorth(netWorth) {
    if (! netWorth) {
      return '';
    }
    // format to a max of 2 decimals
    return Math.round((netWorth || 0) / 10000) / 100;
  }

  function formatNationality(nationality) {
    if (! nationality) {
      return '';
    }
    // given a ISO 3166 Alpha-2 nationality and return country name
    nationality = nationality.toUpperCase();
    return COUNTRIES.find(_ => _['alpha-2-code'] === nationality)?.country || 'ISO: ' + nationality;
  }

  function formatOccupation(occupations) {
    if (! occupations) {
      return '';
    }
    return occupations.join(', ').replace(/_/g, ' ');
  }

  function formatType(occupations) {
    if (! occupations) {
      return '';
    }

    const types = {
      'Sports': ['athlete', 'sports_person', 'football_player', 'basketball_player'],
      'Music': ['artist', 'singer', 'rapper', 'musician'],
      'TV': ['television_presenter', 'presenter'],
      'Chef': ['chef', 'cook', 'restaurateur'],
      'Comedy': ['comedian', 'stand-up_comedian'],
      'Model': ['model', 'supermodel', 'fashion_model'],
      'Personality': ['personality', 'tv_personality'],
      'Books': ['author', 'novelist'],
      'Film': ['actor', 'director', 'film_director'],
    };

    for (let type in types) {
      if (types[type].some(_ => occupations.includes(_))) {
        return type;
      }
    }
    return '';
  }

  return (
    <div className="box app-container">
      <header className="header-container">
        <h1 className="title">Celeb Bulk Lookup</h1>
      </header>

      <form className="config-container" onSubmit={saveApiKey}>
        <h2 className="subtitle">Config</h2>
        <div className="field">
          <label className="label" htmlFor="api_key">API Key: </label>
          <input className="input" type="password" name="api_key" id="api_key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        </div>
        <p>Get your API Key from the <a href="https://api-ninjas.com/api/celebrity" target="_blank" rel="noreferrer">API Ninjas Celebrity API</a></p>
        <button className="button is-primary">Save</button>
      </form>

      {apiKeySaved ? (<form className="input-container" onSubmit={saveCelebNames}>
        <h2 className="subtitle">Input</h2>
        <div className="field">
          <label className="label" htmlFor="names">Paste in celeb names, one per line:</label>
          <textarea className="textarea" name="names" id="names" cols="30" rows="10" onChange={(e) => setCelebsInput(e.target.value)} />
        </div>
        <button className={"button is-primary " + (isLoading ? 'is-loading' : '')}>Lookup</button>
      </form>) : ''}

      {celebErrors.length ?
        (<div className="errors-container">
          <h2 className="subtitle">Errors</h2>
          <table className="table" width="100%">
            <thead>
              <tr>
                <th>Name</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {celebErrors.map(celeb => (<tr key={celeb.name}>
                <td>{celeb.name}</td>
                <td>{celeb.error}</td>
              </tr>))}
            </tbody>
          </table>
        </div>) : ''}

      {celebResults.length ?
        (<div className="output-container">
          <h2 className="subtitle">Output</h2>
          <table className="table" width="100%">
            <thead>
              <tr>
                <th>Name</th>
                <th>Occupation</th>
                <th>Type</th>
                <th>Gender</th>
                <th>Nationality</th>
                <th>Net Worth (M)</th>
                <th>Birthdate</th>
              </tr>
            </thead>
            <tbody>
              {celebResults.map(celeb => (<tr key={celeb.name}>
                <td className="titlecase">{celeb.name}</td>
                <td className="titlecase">{formatOccupation(celeb?.occupation)}</td>
                <td className="titlecase">{formatType(celeb?.occupation)}</td>
                <td className="titlecase">{celeb?.gender}</td>
                <td>{formatNationality(celeb.nationality)}</td>
                <td>{formatNetWorth(celeb.net_worth)}</td>
                <td>{formatBirthdate(celeb?.birthday)}</td>
              </tr>))}
            </tbody>
          </table>
        </div>) : ''}

    </div>
  );
}

export default App;
