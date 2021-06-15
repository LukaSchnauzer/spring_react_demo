'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import follow from './follow';

const path = '/api';

class App extends React.Component {

    constructor(props){
        super(props);
        this.state = {employees : [], attributes: [], pageSize: 2, links: {}};
        this.updatePageSize = this.updatePageSize.bind(this);
		this.onCreate = this.onCreate.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onNavigate = this.onNavigate.bind(this);
    }

    componentDidMount() {
       this.loadFromServer(this.state.pageSize)
    }

    updatePageSize(pageSize) {
        if (pageSize !== this.state.pageSize) {
            this.loadFromServer(pageSize);
        }
    }

    loadFromServer(pageSize) {
        follow(path, [
            {rel: 'employeeEntities', params: {size: pageSize}}]
        ).then(
            employeeCollection =>{
                fetch(employeeCollection._links.profile.href)
                .then(response => response.json())
                .then(
                    schema => {
                        this.setState({
                            employees: employeeCollection._embedded.employeeEntities,
                            attributes: schema.alps.descriptor[0].descriptor.map(d => d.name),
                            pageSize: pageSize,
                            links: employeeCollection._links
                        })
                    }
                );
            }
        );
    }

    onCreate(newEmployee){
        follow(path, ['employeeEntities']
        ).then(
            employeeCollection => {
                return fetch(employeeCollection._links.self.href,{
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(newEmployee)
                });
            }
        ).then(
            response => {
                return follow(path, [
                    {rel: 'employeeEntities', params: {'size': this.state.pageSize}}
                ]);
            }
        ).then(
            response => {
                if(typeof response._links.last != 'undefined') {
                    this.onNavigate(response._links.last.href);
                }else {
                    this.onNavigate(response._links.self.href);
                }
            }
        );
    }

    onNavigate(navUri) {
        fetch(navUri)
        .then(response => response.json())
        .then(
            employeeCollection => {
                this.setState(
                    {
                        employees: employeeCollection._embedded.employeeEntities,
                        attributes: this.state.attributes,
                        pageSize: this.state.pageSize,
                        links: employeeCollection._links 
                    }
                );
            }
        );
    }

    onDelete(employee) {
        fetch(employee._links.self.href,{
            method: 'DELETE',
        })
        .then(
            response => {
                this.loadFromServer(this.state.pageSize);
            }
        );
    }

    render() {
        return(
            <div>
                <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
		        <EmployeeList employees={this.state.employees}
							  links={this.state.links}
							  pageSize={this.state.pageSize}
							  onNavigate={this.onNavigate}
							  onDelete={this.onDelete}
							  updatePageSize={this.updatePageSize}/>
            </div>
        );
    }
}

class EmployeeList extends React.Component {
    constructor(props) {
		super(props);
		this.handleNavFirst = this.handleNavFirst.bind(this);
		this.handleNavPrev = this.handleNavPrev.bind(this);
		this.handleNavNext = this.handleNavNext.bind(this);
		this.handleNavLast = this.handleNavLast.bind(this);
		this.handleInput = this.handleInput.bind(this);
        this.pageSizeRef = React.createRef();
	}

    handleNavFirst(e){
        e.preventDefault();
        this.props.onNavigate(this.props.links.first.href);
    }
    
    handleNavPrev(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.prev.href);
    }
    
    handleNavNext(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.next.href);
    }
    
    handleNavLast(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.last.href);
    }

    handleInput(e) {
        e.preventDefault();
        const pageSize = ReactDOM.findDOMNode(this.pageSizeRef.current).value;
        if (/^[0-9]+$/.test(pageSize)) {
            this.props.updatePageSize(pageSize);
        } else {
            ReactDOM.findDOMNode(this.pageSizeRef.current).value =
                pageSize.substring(0, pageSize.length - 1);
        }
    }

    render() {
        const employees = this.props.employees.map(
            employee => <Employee key={employee._links.self.href} employee={employee} onDelete={this.props.onDelete}/>
        );

        const navLinks = [];
	    if ("first" in this.props.links) {
		    navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
	    }
	    if ("prev" in this.props.links) {
		    navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
        }
        if ("next" in this.props.links) {
            navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
        }
        if ("last" in this.props.links) {
            navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
        }

         return(
            <div>
			    <input ref={this.pageSizeRef} defaultValue={this.props.pageSize} onInput={this.handleInput}/>
                <table>
                    <tbody>
                        <tr>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Description</th>
                            <th></th>
                        </tr>
                        {employees}
                    </tbody>
                </table>
                <div>
                    {navLinks}
                </div>
            </div>
         );
    }
}

class Employee extends React.Component {

    constructor(props) {
		super(props);
		this.handleDelete = this.handleDelete.bind(this);
	}

	handleDelete() {
		this.props.onDelete(this.props.employee);
	}

    render() {
        return(
            <tr>
                <td>{this.props.employee.firstName}</td>
                <td>{this.props.employee.lastName}</td>
                <td>{this.props.employee.description}</td>
                <td><button onClick={this.handleDelete}>Delete</button></td>
            </tr>
        );
    }
}

class CreateDialog extends React.Component {
    constructor(props){
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.attributeRefs = {};
    }

    handleSubmit(e){
        e.preventDefault();
        const newEmployee = {};

        this.props.attributes.forEach(
            attribute => {
                newEmployee[attribute] = ReactDOM.findDOMNode(this.attributeRefs[attribute].current).value.trim();
            }
        );

        this.props.onCreate(newEmployee);

        // Clear dialog's inputs
        this.props.attributes.forEach(
            attribute => {
                ReactDOM.findDOMNode(this.attributeRefs[attribute].current).value = '';
            }
        );

        // Navigate away from the dialog to hide it
        window.location = "#";
    }

    render() {
        const inputs = this.props.attributes.map(
            attribute => {
                const attributeRef = React.createRef();
                this.attributeRefs[attribute] = attributeRef;
                return(
                    <p key={attribute}>
                        <input type="text" placeholder={attribute} ref={attributeRef} className="field"/>
                    </p>
                );
            }
        );

        return(
            <div>
                <a href="#createEmployee">Create</a>
                <div id="createEmployee" className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>
                        <h2>Create new Employee</h2>
                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Create</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

ReactDOM.render(
    <App/>,
    document.getElementById('react')
);
