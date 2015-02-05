// TODO: Add mailing list options
// https://apidocs.mailchimp.com/api/2.0/lists/subscribe.php
// http://stackoverflow.com/questions/19671676/javascript-mailchimp-api-subscribe

Percolate = typeof Percolate === 'undefined' ? {} : Percolate;
Percolate.Contact = {};

Percolate.Contact.Overlay = React.createClass({
  propTypes: {
    containerElement: React.PropTypes.instanceOf(Element)
  },

  getDefaultProps: function() {
    return {
      containerElement: null
    }
  },

  setOpen: function(open) {
    jQuery(this.props.containerElement).toggleClass('contact-open', !! open);
  },

  handleClose: function(event) {
    event.preventDefault();
    this.setOpen(false);
  },

  render: function() {
    return (
      <div className='percolate-contact-overlay'>
        <a className="overlay-close" onClick={this.handleClose}>
          <span className="icon-cross"></span>
        </a>
        <Percolate.Contact.Form setOverlayOpen={this.setOpen} />
      </div>
    )
  }
});

Percolate.Contact.Footer = React.createClass({
  render: function() {
    return (
      <div className="ancillary-contact vcard">
        <div className="wrapper-connect">
          <div className="title-ancillary">Connect</div>
          <div className="list">
            <a className="url monochrome" href="http://twitter.com/percolatestudio" target="_blank">Twitter</a>
            <a className="url monochrome" href="http://github.com/percolatestudio" target="_blank">Github</a>
            <a className="email monochrome" href="mailto:us@percolatestudio.com?subject=Hello%20Percolate">Email</a>
          </div>
        </div>
        <div className="wrapper-visit">
          <div className="title-ancillary">Visit Us</div>
          <a className="location-wrapper organization-unit adr"
            href="https://www.google.com/maps/place/169+11th+St,+San+Francisco,+CA+94103/@37.77357,-122.415787,17z/data=!3m1!4b1!4m2!3m1!1s0x8085809d83ced185:0xf5e9ad23d5cd5ce5" target="_blank">
            <span className="fn organization-name" style={ {display: 'none'} }>Percolate Studio</span>
            <span>Percolate USA</span><br/>
            <span className="street-address">169 11th Street</span><br/>
            <span className="locality">San Francisco</span>, <span className="region">CA</span> <span className="postal-code">94103</span>
          </a>
          <a className="location-wrapper organization-unit adr"
            href="https://www.google.com/maps/place/50+Herbert+St,+Northcote+VIC+3070,+Australia/@-37.771764,144.995165,17z/data=!3m1!4b1!4m2!3m1!1s0x6ad6437ca420f13f:0xb6908ada5cdfa379"  target="_blank">
            <span>Percolate AUS</span><br/>
            <span className="street-address">50 Herbert Street</span><br/>
            <span className="locality">Melbourne</span>, <span className="region">VIC</span> <span className="postal-code">3001</span>
          </a>
        </div>
      </div>
    )
  }
});

// Gathers all truthy values in obj referenced by keys and returns matching
// keys in an array
var gatherTruthy = function(/* obj, ...keys */) {
  var keys = Array.prototype.slice.call(arguments);
  var result = [];

  obj = keys.shift();

  _.each(keys, function(key) {
    if (obj[key] && result.indexOf(key) === -1)
      result.push(key);
  });

  return result;
}

Percolate.Contact.Form = React.createClass({
  mixins: [React.addons.LinkedStateMixin],

  getInitialState: function() {
    return {
      name: '',
      email: '',
      about: '',
      strategy: false,
      design: false,
      engineering: false,
      consulting: false,
      today: false,
      quarter: false,
      year: false,
      '25k': false,
      '50k': false,
      '100k': false,
      notsure: false,
      errors: {},
      submitting: false
    };
  },

  getModel: function() {
    var model = _.pick(this.state, 'name', 'email', 'about');
    model.services = gatherTruthy(this.state, 'strategy', 'design',
      'engineering', 'consulting');
    model.timing = gatherTruthy(this.state, 'today', 'quarter', 'year');
    model.budget = gatherTruthy(this.state, '25k', '50k', '100k', 'notsure');

    return model;
  },

  handleSubmit: function(event) {
    event.preventDefault();

    if (this.validate()) {
      this.send();
    }
  },

  componentDidMount: function() {
    jQuery(this.refs.about.getDOMNode()).autosize();
  },

  alertClass: function(name) {
    return this.state.errors[name] ? 'alert' : '';
  },

  // urgh, wish we had a schema library
  validate: function() {
    var errors = this.state.errors = {},
      valid = true,
      model = this.getModel();

    _.each(['name', 'email', 'about'], function(field) {
      if (! model[field]) {
        errors[field] = 'is required';
        valid = false;
      } else if (model[field].length > 10000) {
        errors[field] = 'is too long';
        valid = false;
      }
    }.bind(this));

    _.each(['services', 'timing'], function(field) {
      if (! model[field].length) {
        errors[field] = 'is required';
        valid = false;
      }
    }.bind(this));

    if (this.shouldHaveBudget() && ! model.budget.length) {
      errors['budget'] = 'is required';
      valid = false;
    }

    this.setState({errors: errors});

    return valid;
  },

  send: function(model) {
    var model = this.getModel();
    var to = 'us@percolatestudio.com';
    var subject = 'Work with us';
    var body = React.renderToStaticMarkup(
      <Percolate.Contact.FormEmail model={model}/>);

    var data = {
        'key': '-JqlbKb2ZHU7R5NEkCvnKw', // changeme
        'message': {
          'from_email': model.email,
          'to': [
              {
                'email': to,
                'name': 'Percolate Studio',
                'type': 'to'
              },
              {
                'email': 'zol@percolatestudio.com', // just in case us@ breaks
                'name': 'Zoltan Olah',
                'type': 'to'
              }
            ],
          'autotext': 'true',
          'subject': subject,
          'html': body
        }
      };

    this.setState({ submitting: true });
    jQuery.post('https://mandrillapp.com/api/1.0/messages/send.json', data)
      .done(function() {
        alert('Thank you. We will contact you shortly');
      })
      .fail(function() {
        // fallback incase ajax fails
        window.open('mailto:' + to
          + '?subject=' + subject + ' (mailto)'
          + '&body=' + escape(body)
        );
      })
      .always(function() {
        this.setState({ submitting: false });
        this.props.setOverlayOpen(false);
      }.bind(this));
  },

  error: function(name) {
    if (this.state.errors[name])
      return (<span className="error">{this.state.errors[name]}</span>);
  },

  shouldHaveBudget: function() {
    return this.state.strategy || this.state.design || this.state.engineering;
  },

  render: function() {
    var budgetFieldsetClasses = "fieldset-group hidden "
      + (this.shouldHaveBudget() ? 'visible' : '');

    var servicesError = this.error('services');

    var servicesLabel = servicesError ? servicesError :
      (<span className="subtext">Select all that apply</span>);

    return (
      <form className="contact-form-wrapper" onSubmit={this.handleSubmit}>
        <div className="title-overlay">Work with us</div>
        <fieldset>
          <div className="input-symbol left">
            <input type="text" name="name" className={this.alertClass('name')} placeholder="Name" valueLink={this.linkState('name')} />
            <span className="icon-user"></span>
          </div>
          <div className="input-symbol left">
            <input type="email" name="email" className={this.alertClass('email')} placeholder="Email Address" valueLink={this.linkState('email')} />
            <span className="icon-email"></span>
          </div>
          <textarea className={'about ' + this.alertClass('about')} name="about" placeholder="About your company and project" valueLink={this.linkState('about')} ref="about" />
          <div className="fieldset-group services">
            <div className="fieldset-group-title">Services {servicesLabel}</div>

            <div className="btns-group">
              <input type="checkbox" name="services" value="strategy" id="strategy" checkedLink={this.linkState('strategy')} />
              <label htmlFor="strategy" className="btn-toggle">Strategy</label>

              <input type="checkbox" name="services" value="design" id="design" checkedLink={this.linkState('design')} />
              <label htmlFor="design" className="btn-toggle">Design</label>

              <input type="checkbox" name="services" value="engineering" id="engineering" checkedLink={this.linkState('engineering')} />
              <label htmlFor="engineering" className="btn-toggle">Engineering</label>

              <input type="checkbox" name="services" value="consulting" id="consulting" checkedLink={this.linkState('consulting')} />
              <label htmlFor="consulting" className="btn-toggle">Consulting</label>
            </div>
          </div>
          <div className="fieldset-group">
            <div className="fieldset-group-title">Timing {this.error('timing')}</div>

            <div className="btns-group">
              <input type="radio" name="timing" value="today" id="today" checkedLink={this.linkState('today')} />
              <label htmlFor="today" className="btn-toggle">Today</label>

              <input type="radio" name="timing" value="quarter" id="quarter" checkedLink={this.linkState('quarter')} />
              <label htmlFor="quarter" className="btn-toggle">Quarter</label>

              <input type="radio" name="timing" value="year" id="year" checkedLink={this.linkState('year')} />
              <label htmlFor="year" className="btn-toggle">This Year</label>
            </div>
          </div>
          <div className={budgetFieldsetClasses}>
            <div className="fieldset-group-title">Budget {this.error('budget')}</div>

            <div className="btns-group">
              <input type="radio" name="budget" value="25k" id="25k" checkedLink={this.linkState('25k')} />
              <label htmlFor="25k" className="btn-toggle">25k–50k</label>

              <input type="radio" name="budget" value="50k" id="50k" checkedLink={this.linkState('50k')} />
              <label htmlFor="50k"  className="btn-toggle">50k–100k</label>

              <input type="radio" name="budget" value="100k" id="100k" checkedLink={this.linkState('100k')} />
              <label htmlFor="100k" className="btn-toggle" >+100k</label>

              <input type="radio" name="budget" value="notsure" id="notsure" checkedLink={this.linkState('notsure')} />
              <label htmlFor="notsure"  className="btn-toggle">Not sure</label>
            </div>

          </div>
          <button className="btn-primary caps" disabled={this.state.submitting} type="submit">Send Message</button>
        </fieldset>
        <Percolate.Contact.Footer />
      </form>
    )
  }
});

Percolate.Contact.FormEmail = React.createClass({
  render: function() {
    var model = this.props.model;

    var servicesNodes = model.services.map(function(service, index) {
      return ( <li key={index}>{service}</li> );
    });

    var timing = model.timing.join();
    var budget = model.budget.join();

    var budgetNodes = budget ? [<dt key='0'>Budget</dt>, <dd key='1'>{budget}</dd>] : null;

    return (
      <dl>
        <dt>Name</dt><dd>{model.name}</dd>
        <dt>Email</dt><dd>{model.email}</dd>
        <dt>About</dt><dd>{model.about}</dd>
        <dt>Services</dt><dd><ul>{servicesNodes}</ul></dd>
        <dt>Timing</dt><dd>{timing}</dd>
        {budgetNodes}
        <dt>Referer</dt><dd>Blog</dd>
      </dl>
    )
  }
});
