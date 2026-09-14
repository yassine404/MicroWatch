package com.dxc.observability.user_service.service;

import com.dxc.observability.user_service.dto.LoginRequest;
import com.dxc.observability.user_service.dto.LoginResponse;
import com.dxc.observability.user_service.dto.SignupRequest;
import com.dxc.observability.user_service.dto.UserResponse;
import com.dxc.observability.user_service.entity.User;
import com.dxc.observability.user_service.enums.AccountStatus;
import com.dxc.observability.user_service.enums.Role;
import com.dxc.observability.user_service.exception.UserAlreadyExistsException;
import com.dxc.observability.user_service.repository.UserRepository;
import com.dxc.observability.user_service.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserResponse signup(SignupRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already in use: " + request.getEmail());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.VIEWER)
                .status(AccountStatus.PENDING)    
                .build();

        User saved = userRepository.save(user);

        return UserResponse.builder()
                .id(saved.getId())
                .username(saved.getUsername())
                .email(saved.getEmail())
                .role(saved.getRole())
                .status(user.getStatus())
                .build();
    }

    public LoginResponse login(LoginRequest request) {
    User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));

    if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
        throw new RuntimeException("Invalid credentials");
    }

    if (user.getStatus() != null && user.getStatus() != AccountStatus.ACTIVE)  {
    throw new RuntimeException("Your account is pending approval by an administrator.");
    }

    String token = jwtUtil.generateToken(
            user.getId().toString(),
            user.getUsername(),
            user.getRole().name()
    );

    return LoginResponse.builder()
            .token(token)
            .username(user.getUsername())
            .role(user.getRole().name())
            .build();
}
}