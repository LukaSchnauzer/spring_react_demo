package com.demo.springreact;

import com.demo.springreact.entities.EmployeeEntity;
import com.demo.springreact.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseLoader implements CommandLineRunner {

    private final EmployeeRepository repository;

    @Autowired
    public DatabaseLoader(EmployeeRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) throws Exception {
        this.repository.save(new EmployeeEntity("Juan","Montero","Developer"));
        this.repository.save(new EmployeeEntity("Carlos","Santiago","Contador"));
        this.repository.save(new EmployeeEntity("Majo","Santiago","Profesor"));
    }
}
