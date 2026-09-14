package com.dxc.observability.user_service.service;

import com.dxc.observability.user_service.dto.UserResponse;
import com.dxc.observability.user_service.entity.User;
import com.dxc.observability.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse getUserById(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }

    
    public void changePassword(UUID userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new RuntimeException("Old password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}