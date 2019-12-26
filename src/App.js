import React, { Component } from 'react';
import { withScriptjs, withGoogleMap, GoogleMap, Polygon } from 'react-google-maps';
import { geoToH3, h3ToGeoBoundary } from 'h3-js';
import NumericInput from 'react-numeric-input';

var polygonCenter = require('geojson-polygon-center');


// const h3Index = geoToH3(13.067439, 80.237617, 8)
// let hexBoundary = h3ToGeoBoundary(h3Index)
// hexBoundary.push(hexBoundary[0])

function h3ToPolyline(h3idx) {
  let hexBoundary = h3ToGeoBoundary(h3idx)
  hexBoundary.push(hexBoundary[0])

  let arr = []
  for (const i of hexBoundary) {
    arr.push({lat: i[0], lng: i[1]})
  }

  return arr
}

window.mapInstance = null

const H3MapComponent = withScriptjs(withGoogleMap((props) =>
  <GoogleMap
    defaultZoom={12}
    defaultCenter={props.markerPosition}
    ref={el => window.mapInstance = el }
    onClick={props.onClickMap}
  >
  {
    props.hexagons.map(hex => (
      <Polygon
        key={hex.h3}
        path={h3ToPolyline(hex.h3)}
        options={{fillColor: '#FF0000', fillOpacity: hex.opacity, strokeColor: '#FF0000', strokeWeight: 2}}
      />
    ))
  }
  </GoogleMap>
))

// It cames from m500-17_13_GML.zip	on http://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh500.html
const geoJson = require('./Mesh4_POP_13.json');

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      lat: 35.684091,
      lng: 139.749757,
      year: '2020',
      segment: '',
      resolution: 7,
    };

    this.state.hexagons = this.calculateHexagons(this.state.year, this.state.segment, this.state.resolution);
    
    this.handleInputChangeResolution = this.handleInputChangeResolution.bind(this);
    this.handleInputChangeYear = this.handleInputChangeYear.bind(this);
    this.handleInputChangeSegment = this.handleInputChangeSegment.bind(this);
    this.handleOnClickMap = this.handleOnClickMap.bind(this);
    this.handleOnClickSubmit = this.handleOnClickSubmit.bind(this);
  }

  calculateHexagons(year, segment, resolution) {
    const label = 'POP' + year + segment;
    let hexagons = {};

    for (let i = 0; i < geoJson.features.length; i++) {
      const {type, geometry, properties} = geoJson.features[i];
      if (type !== 'Feature')
        throw new Error(`Unhandled type: ${type}`);

      const center = polygonCenter(geometry);
      const h3Index = geoToH3(center.coordinates[1], center.coordinates[0], resolution);

      hexagons[h3Index] = properties[label] + (hexagons[h3Index] || 0);
    }

    const maximum = Math.max.apply(null, Object.values(hexagons));
    return Object.entries(hexagons).map((item) => {
      return {
        'h3': item[0],
        'population': item[1],
        'opacity': item[1] / maximum,
      }
    });
  }

  handleInputChangeResolution(num) {
    this.setState({
      resolution: num,
    });
  }

  handleInputChangeYear(e) {
    this.setState({
      year: e.target.value
    });
  }

  handleInputChangeSegment(e) {
    this.setState({
      segment: e.target.value
    });
  }

  handleOnClickMap(e) {
    console.log(e)
  }

  handleOnClickSubmit() {
    this.setState(state => {
      return {
        hexagons: this.calculateHexagons(state.year, state.segment, state.resolution),
      };
    })
  }

  render() {
    let apiKey = 'AIzaSyAT8jfo6wpzXcgHbis_GlC87rNDz5aIzQU'
    let mapUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=3.exp&libraries=geometry,drawing,places`

    return (
      <div style={{ height: `100%`}}>
        <nav className="navbar navbar-light" style={{ backgroundColor: '#563F7A', height: '5%' }}>
          <div className="mx-auto order-0">
            <a className="navbar-brand mx-auto" href="https://github.com/tak2siva/uber-h3-gmaps-ui" style={{color: 'white'}}>Uber's H3 Playground</a>
          </div>
        </nav>

      <div style={{ height: `95%`}} className='d-flex'>
        <div style={{ height: `100%`, width: `100%`}} className='p-2'>
          <H3MapComponent
            isMarkerShown
            googleMapURL={mapUrl}
            loadingElement={<div style={{ height: `100%` }} />}
            containerElement={<div style={{ height: `100%`, width: `100%`}} />}
            mapElement={<div style={{ height: `100%` }} />}
            hexagons={this.state.hexagons}
            onClickMap={this.handleOnClickMap}
            markerPosition={{ lat: this.state.lat, lng: this.state.lng }}
          />   
        </div>
        <div style={{paddingRight: '20px'}} className='p-2'>
          <form>
            <div className='form-group'>
              <label>
                Resolution:
              </label>
              <NumericInput className="res_input form-control" min={5} max={8} value={this.state.resolution} onChange={this.handleInputChangeResolution} />
            </div>
            <div className='form-group'>
              <label>
                Year:
              </label>
              <select className="form-control" value={this.state.year} onChange={this.handleInputChangeYear}>
                <option value="2010">2010</option>
                <option value="2020">2020</option>
                <option value="2025">2025</option>
                <option value="2030">2030</option>
                <option value="2035">2035</option>
                <option value="2040">2040</option>
                <option value="2045">2045</option>
                <option value="2050">2050</option>
              </select>
            </div>
            <div className='form-group'>
              <label>
                Segment:
              </label>
              <select className="form-control" value={this.state.segment} onChange={this.handleInputChangeSegment}>
                <option value="">全年代</option>
                <option value="A">0-14歳</option>
                <option value="B">15-64歳</option>
                <option value="C">65歳以上</option>
                <option value="D">75歳以上</option>
              </select>
            </div>
          </form>
          <hr/>
          <button className='btn btn-success' style={{marginTop: `10px`, width: `100%`}} onClick={this.handleOnClickSubmit}>
            Submit
          </button>
        </div>
      </div>
      </div>
    );
  }
}

export default App;
