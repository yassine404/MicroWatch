package com.dxc.observability.user_service.config;

import com.dxc.observability.user_service.entity.User;
import com.dxc.observability.user_service.enums.AccountStatus;
import com.dxc.observability.user_service.enums.Role;
import com.dxc.observability.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // S'assurer que l'admin_sup existe et est ACTIVE
        if (!userRepository.existsByUsername("admin_sup")) {
            User adminSup = User.builder()
                    .username("admin_sup")
                    .email("admin_sup@dxc.com")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN_SUP)
                    .status(AccountStatus.ACTIVE)
                    .build();
            userRepository.save(adminSup);
        } else {
            userRepository.findByUsername("admin_sup").ifPresent(u -> {
                if (u.getStatus() == null) {
                    u.setStatus(AccountStatus.ACTIVE);
                    userRepository.save(u);
                }
            });
        }
    }
}